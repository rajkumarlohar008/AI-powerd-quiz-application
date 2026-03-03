import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import Result from './Result';
import './Quiz.css';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const navigate = useNavigate();

    // Fetch quiz questions on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchQuestions = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/quiz`);
                setQuestions(response.data.questions);
                setLoading(false);
            } catch (err) {
                setError('Failed to load quiz questions');
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [navigate]);

    // Timer countdown
    useEffect(() => {
        if (loading || showResult) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestion, loading, showResult]);

    const handleAnswerSelect = (index) => {
        setSelectedAnswer(index);
    };

    const handleNext = () => {
        // Save the answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = selectedAnswer;
        setUserAnswers(newAnswers);

        // Move to next question or show results
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(newAnswers[currentQuestion + 1] ?? null);
            setTimeLeft(30);
        } else {
            setShowResult(true);
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setSelectedAnswer(userAnswers[currentQuestion - 1] ?? null);
            setTimeLeft(30);
        }
    };

    if (loading) {
        return (
            <div className="quiz-container">
                <div className="quiz-card">
                    <p className="loading">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-container">
                <div className="quiz-card">
                    <p className="error">{error}</p>
                </div>
            </div>
        );
    }

    if (showResult) {
        return <Result questions={questions} userAnswers={userAnswers} />;
    }

    const question = questions[currentQuestion];

    return (
        <div className="quiz-container">
            <div className="quiz-card">
                <div className="quiz-header">
                    <div className="question-counter">
                        Question {currentQuestion + 1} of {questions.length}
                    </div>
                    <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                        {timeLeft}s
                    </div>
                </div>

                <div className="question-section">
                    <h2 className="question-text">{question.question}</h2>

                    <div className="options-container">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                className={`option-button ${selectedAnswer === index ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(index)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="quiz-actions">
                    <button
                        className="btn-quiz btn-back"
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                    >
                        Back
                    </button>
                    <button
                        className="btn-quiz btn-next"
                        onClick={handleNext}
                        disabled={selectedAnswer === null}
                    >
                        {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
