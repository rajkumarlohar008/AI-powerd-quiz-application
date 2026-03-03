import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleStartQuiz = () => {
        navigate('/quiz');
    };

    const handleStartAiQuiz = () => {
        navigate('/ai-quiz');
    };

    const handleViewHistory = () => {
        navigate('/history');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-card">
                <h2>Welcome to Quiz App!</h2>
                {user && (
                    <div className="user-info">
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                    </div>
                )}
                <p className="dashboard-message">You are successfully logged in.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={handleStartQuiz}
                            className="btn-logout"
                            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                            Start Predefined Quiz
                        </button>
                        <button onClick={handleStartAiQuiz} className="btn-logout">
                            Start AI Quiz (Gemini)
                        </button>
                    </div>
                    <button onClick={handleViewHistory} className="btn-logout" style={{ background: '#28a745' }}>
                        View Quiz History
                    </button>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
