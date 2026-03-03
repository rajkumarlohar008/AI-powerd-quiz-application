import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './Result.css';

const Result = ({ questions, userAnswers }) => {
    const navigate = useNavigate();
    const savedRef = useRef(false);

    // Calculate score
    const calculateScore = () => {
        let correct = 0;
        let incorrect = 0;

        questions.forEach((question, index) => {
            if (userAnswers[index] === question.correctAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });

        return { correct, incorrect, total: questions.length };
    };

    const score = calculateScore();
    const percentage = Math.round((score.correct / score.total) * 100);

    // Save quiz attempt to backend once when result is shown
    useEffect(() => {
        if (savedRef.current || !questions?.length) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        savedRef.current = true;
        const payload = {
            userId: user.id,
            quizType: 'PREDEFINED',
            correct: score.correct,
            total: score.total,
            percentage,
            questions: questions.map((q, index) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                userAnswer: userAnswers[index] ?? null,
                explanation: null,
                topic: null,
            })),
        };
        axios.post(`${API_URL}/api/quiz-attempts`, payload).catch(() => {});
    }, [questions, userAnswers, score.correct, score.total, percentage]);

    const handleRetake = () => {
        window.location.reload();
    };

    const handleDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="result-container">
            <div className="result-card">
                <div className="result-header">
                    <h2>Quiz Completed! 🎉</h2>
                </div>

                <div className="score-display">
                    <h3>{percentage}%</h3>
                    <p>Your Score</p>
                </div>

                <div className="score-breakdown">
                    <div className="score-item correct">
                        <h4>{score.correct}</h4>
                        <p>Correct</p>
                    </div>
                    <div className="score-item incorrect">
                        <h4>{score.incorrect}</h4>
                        <p>Incorrect</p>
                    </div>
                    <div className="score-item">
                        <h4>{score.total}</h4>
                        <p>Total</p>
                    </div>
                </div>

                <div className="answers-review">
                    <h3>Review Your Answers</h3>
                    {questions.map((question, index) => {
                        const isCorrect = userAnswers[index] === question.correctAnswer;
                        const userAnswerText = userAnswers[index] !== null && userAnswers[index] !== undefined
                            ? question.options[userAnswers[index]]
                            : 'Not answered';
                        const correctAnswerText = question.options[question.correctAnswer];

                        return (
                            <div key={index} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                <div className="answer-question">
                                    Q{index + 1}: {question.question}
                                </div>

                                <div className="answer-details">
                                    <p><strong>Your Answer:</strong> {userAnswerText}</p>
                                    {!isCorrect && (
                                        <p><strong>Correct Answer:</strong> {correctAnswerText}</p>
                                    )}
                                </div>
                                <div className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="result-actions">
                    <button className="btn-result btn-retake" onClick={handleRetake}>
                        Retake Quiz
                    </button>
                    <button className="btn-result btn-dashboard" onClick={handleDashboard}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Result;
