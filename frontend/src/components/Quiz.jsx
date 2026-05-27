import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import Result from './Result';
import Nav from './Nav';
import QuizScreen from './QuizScreen'; // <-- Imported

const Quiz = () => {

    const [questions, setQuestions] = useState([]);
    const [user, setUser] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isFinishDisabled, setIsFinishDisabled] = useState(false);

    const navigate = useNavigate();

    // Fetch Quiz Questions
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchQuestions = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/api/quiz`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setQuestions(response.data.questions);
                setLoading(false);
            } catch (err) {
                setError('Failed to load quiz questions');
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [navigate]);

    // Timer
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
    }, [currentQuestion, loading, showResult]);

    // Select Answer
    const handleAnswerSelect = (index) => {
        setSelectedAnswer(index);
    };

    // Next Question
    const handleNext = () => {
        if (currentQuestion === questions.length - 1 && isFinishDisabled) {
            return;
        }

        if (currentQuestion === questions.length - 1) {
            setIsFinishDisabled(true);
        }

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = selectedAnswer;
        setUserAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(newAnswers[currentQuestion + 1] ?? null);
            setTimeLeft(30);
        } else {
            setShowResult(true);
        }
    };

    // Back Question
    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setSelectedAnswer(userAnswers[currentQuestion - 1] ?? null);
            setTimeLeft(30);
        }
    };

    // Loading
    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950'>
                <div className='text-cyan-400 text-3xl font-bold animate-pulse tracking-wider drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]'>
                    Loading Quiz...
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950 px-4'>
                <div className='bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl text-xl font-semibold backdrop-blur-lg shadow-[0_0_30px_rgba(239,68,68,0.15)] tracking-wide'>
                    {error}
                </div>
            </div>
        );
    }

    // Result
    if (showResult) {
        return <Result questions={questions} userAnswers={userAnswers} />;
    }

    const question = questions[currentQuestion];

    return (
        <QuizScreen 
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
            questionData={question}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleAnswerSelect}
            onNext={handleNext}
            onBack={handleBack}
            isNextDisabled={selectedAnswer === null || (currentQuestion === questions.length - 1 && isFinishDisabled)}
            isBackDisabled={currentQuestion === 0}
            nextText={currentQuestion === questions.length - 1 ? (isFinishDisabled ? 'Submitting...' : 'Finish') : 'Next'}
            timeLeft={timeLeft}
        />
    );
};

export default Quiz;