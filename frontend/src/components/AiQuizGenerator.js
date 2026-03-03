import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import './Quiz.css';
import './Result.css';

const AiQuizGenerator = () => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setQuiz(null);
        setUserAnswers([]);
        setShowSummary(false);
        setSummary(null);

        try {
            const formData = new FormData();
            if (text.trim()) {
                formData.append('text', text);
            }
            if (file) {
                formData.append('file', file);
            }

            // Do not set Content-Type manually - axios sets multipart/form-data with boundary
            const res = await axios.post(`${API_URL}/api/ai/generate-quiz`, formData);

            setQuiz(res.data);
            setUserAnswers(new Array(res.data.questions.length).fill(null));
            setCurrentQuestion(0);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to generate quiz.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (index) => {
        const updated = [...userAnswers];
        updated[currentQuestion] = index;
        setUserAnswers(updated);
    };

    const handleNext = () => {
        if (!quiz) return;
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            handleSubmitAnswers();
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmitAnswers = async () => {
        if (!quiz) return;
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/api/ai/quiz-summary`, {
                questions: quiz.questions,
                userAnswers,
            });
            setSummary(res.data);
            setShowSummary(true);

            // Save AI quiz attempt to backend
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id && quiz.questions?.length) {
                const total = quiz.questions.length;
                const correct = quiz.questions.filter((q, i) => userAnswers[i] === q.answerIndex).length;
                const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                const payload = {
                    userId: user.id,
                    quizType: 'AI',
                    correct,
                    total,
                    percentage,
                    questions: quiz.questions.map((q, index) => ({
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.answerIndex,
                        userAnswer: userAnswers[index] ?? null,
                        explanation: q.explanation || null,
                        topic: q.topic || null,
                    })),
                };
                axios.post(`${API_URL}/api/quiz-attempts`, payload).catch(() => {});
            }
        } catch (err) {
            setError('Failed to generate quiz summary.');
        } finally {
            setLoading(false);
        }
    };

    const handleRetake = () => {
        setQuiz(null);
        setUserAnswers([]);
        setShowSummary(false);
        setSummary(null);
        setText('');
        setFile(null);
        setCurrentQuestion(0);
    };

    const handleDashboard = () => {
        navigate('/dashboard');
    };

    const current = quiz && quiz.questions[currentQuestion];

    // 1) Initial screen: use same card style, but with input form
    if (!quiz && !showSummary) {
        return (
            <div className="quiz-container">
                <div className="quiz-card">
                    <div className="quiz-header" style={{ borderBottom: 'none', marginBottom: '10px' }}>
                        <div className="question-counter">AI Quiz Generator (Gemini)</div>
                    </div>

                    <form onSubmit={handleGenerate}>
                        <div className="question-section">
                            <h2 className="question-text">Paste text (optional)</h2>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={5}
                                style={{ width: '100%', padding: '10px' }}
                                placeholder="Paste study material here..."
                            />
                        </div>

                        <div className="question-section">
                            <h2 className="question-text">Or upload file (PDF / text)</h2>
                            <input
                                type="file"
                                accept="application/pdf,text/plain"
                                onChange={(e) => setFile(e.target.files[0] || null)}
                            />
                        </div>

                        {error && <p className="error">{error}</p>}

                        <div className="quiz-actions">
                            <button
                                type="submit"
                                className="btn-quiz btn-next"
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : 'Generate Quiz'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 2) Quiz playing screen: mimic existing quiz UI
    if (quiz && !showSummary && current) {
        return (
            <div className="quiz-container">
                <div className="quiz-card">
                    <div className="quiz-header">
                        <div className="question-counter">
                            Question {currentQuestion + 1} of {quiz.questions.length}
                        </div>
                    </div>

                    <div className="question-section">
                        <h2 className="question-text">{current.question}</h2>

                        <div className="options-container">
                            {current.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className={`option-button ${
                                        userAnswers[currentQuestion] === idx ? 'selected' : ''
                                    }`}
                                    onClick={() => handleAnswerSelect(idx)}
                                >
                                    {opt}
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
                            disabled={userAnswers[currentQuestion] === null}
                        >
                            {currentQuestion === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3) Summary screen: mimic existing result UI, plus AI insights
    if (quiz && showSummary && summary) {
        const total = quiz.questions.length;
        const correct = quiz.questions.reduce(
            (acc, q, idx) => (userAnswers[idx] === q.answerIndex ? acc + 1 : acc),
            0
        );
        const incorrect = total - correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return (
            <div className="result-container">
                <div className="result-card">
                    <div className="result-header">
                        <h2>AI Quiz Summary 🎓</h2>
                    </div>

                    <div className="score-display">
                        <h3>{percentage}%</h3>
                        <p>Your Score</p>
                    </div>

                    <div className="score-breakdown">
                        <div className="score-item correct">
                            <h4>{correct}</h4>
                            <p>Correct</p>
                        </div>
                        <div className="score-item incorrect">
                            <h4>{incorrect}</h4>
                            <p>Incorrect</p>
                        </div>
                        <div className="score-item">
                            <h4>{total}</h4>
                            <p>Total</p>
                        </div>
                    </div>

                    {summary.overallSummary && (
                        <div className="answers-review">
                            <h3>Overall Feedback</h3>
                            <p>{summary.overallSummary}</p>
                        </div>
                    )}

                    {summary.topics && (
                        <div className="answers-review">
                            <h3>Topic Strengths</h3>
                            {summary.topics.map((t, idx) => (
                                <div key={idx} className="answer-item">
                                    <div className="answer-question">
                                        {t.topic} — {t.strength} ({t.correct}/{t.total})
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {summary.recommendations && (
                        <div className="answers-review">
                            <h3>Recommendations</h3>
                            <ul>
                                {summary.recommendations.map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="answers-review">
                        <h3>Answers & Explanations</h3>
                        {quiz.questions.map((q, idx) => {
                            const userIdx = userAnswers[idx];
                            const correctIdx = q.answerIndex;
                            const isCorrect = userIdx === correctIdx;
                            const userAnswerText =
                                userIdx !== null && userIdx !== undefined
                                    ? q.options[userIdx]
                                    : 'Not answered';
                            const correctAnswerText = q.options[correctIdx];

                            return (
                                <div
                                    key={idx}
                                    className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}
                                >
                                    <div className="answer-question">
                                        Q{idx + 1}: {q.question}
                                    </div>
                                    <div className="answer-details">
                                        <p>
                                            <strong>Your Answer:</strong> {userAnswerText}
                                        </p>
                                        <p>
                                            <strong>Correct Answer:</strong> {correctAnswerText}
                                        </p>
                                        <p>
                                            <strong>Explanation:</strong> {q.explanation}
                                        </p>
                                    </div>
                                    <div
                                        className={`answer-status ${
                                            isCorrect ? 'correct' : 'incorrect'
                                        }`}
                                    >
                                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="result-actions">
                        <button className="btn-result btn-retake" onClick={handleRetake}>
                            Retake AI Quiz
                        </button>
                        <button className="btn-result btn-dashboard" onClick={handleDashboard}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AiQuizGenerator;

