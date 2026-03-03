import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './QuizHistory.css';

const QuizHistory = () => {
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }
        const u = userData ? JSON.parse(userData) : null;
        setUser(u);
        if (!u?.id) {
            setLoading(false);
            return;
        }

        axios
            .get(`${API_URL}/api/quiz-history`, { params: { userId: u.id } })
            .then((res) => {
                setHistory(res.data);
            })
            .catch(() => setError('Failed to load quiz history.'))
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleDashboard = () => navigate('/dashboard');

    if (loading) {
        return (
            <div className="history-container">
                <div className="history-card">
                    <p className="history-loading">Loading your quiz history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="history-container">
                <div className="history-card">
                    <p className="history-error">{error}</p>
                    <button type="button" className="btn-history btn-dashboard" onClick={handleDashboard}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const attempts = history?.attempts || [];
    const totalAttempts = history?.totalAttempts ?? 0;
    const averagePercentage = history?.averagePercentage ?? 0;

    return (
        <div className="history-container">
            <div className="history-card">
                <h2>Quiz History</h2>
                {user && (
                    <p className="history-user">
                        {user.name} — view your past attempts and overall performance.
                    </p>
                )}

                <div className="history-stats">
                    <div className="history-stat overall">
                        <h3>{totalAttempts === 0 ? '—' : averagePercentage.toFixed(1)}%</h3>
                        <p>Overall average (all quizzes)</p>
                    </div>
                    <div className="history-stat">
                        <h3>{totalAttempts}</h3>
                        <p>Total attempts</p>
                    </div>
                </div>

                {attempts.length === 0 ? (
                    <p className="history-empty">No quiz attempts yet. Complete a quiz to see your history here.</p>
                ) : (
                    <div className="history-list">
                        <h3>Previous attempts</h3>
                        {attempts.map((attempt) => (
                            <div key={attempt.id} className="history-item">
                                <div className="history-item-type">{attempt.quizType === 'AI' ? 'AI Quiz' : 'Predefined Quiz'}</div>
                                <div className="history-item-score">
                                    {attempt.correct}/{attempt.total} — {attempt.percentage.toFixed(0)}%
                                </div>
                                <div className="history-item-date">
                                    {attempt.createdAt
                                        ? new Date(attempt.createdAt).toLocaleString()
                                        : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="history-actions">
                    <button type="button" className="btn-history btn-dashboard" onClick={handleDashboard}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizHistory;
