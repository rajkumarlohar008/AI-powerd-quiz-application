import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const QuizHistory = () => {

    const [user, setUser] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Track which attempt the user clicked to view details
    const [selectedAttempt, setSelectedAttempt] = useState(null);

    const navigate = useNavigate();

    // Fetch History
    useEffect(() => {

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        const u = userData
            ? JSON.parse(userData)
            : null;

        setUser(u);

        if (!u?.id) {
            setLoading(false);
            return;
        }

        axios
            .get(
                `${API_URL}/api/quiz-history`,
                {
                    params: {
                        userId: u.id
                    }
                }
            )
            .then((res) => {
                setHistory(res.data);
            })
            .catch(() => {
                setError(
                    'Failed to load quiz history.'
                );
            })
            .finally(() => {
                setLoading(false);
            });

    }, [navigate]);

    // Dashboard
    const handleDashboard = () => {
        navigate('/dashboard');
    };

    // Loading
    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950'>
                <div className='text-cyan-400 text-3xl font-bold animate-pulse'>
                    Loading Quiz History...
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950 px-4'>
                <div className='w-full max-w-xl rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-8 text-center'>
                    <p className='text-red-400 text-xl font-semibold mb-6'>{error}</p>
                    <button
                        type='button'
                        onClick={handleDashboard}
                        className='px-6 py-3 rounded-2xl text-white font-bold bg-linear-to-r from-cyan-500 to-purple-600 hover:scale-105 active:scale-95 transition-all duration-300'
                    >
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
        /* FIX 1: Changed wrapper to h-screen overflow-hidden to let children handle individual inner scrolling */
        <div className='relative h-screen w-screen overflow-hidden bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center p-4 md:p-8'>

            {/* Glow Effects */}
            <div className='pointer-events-none absolute -top-30 -left-30 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='pointer-events-none absolute -bottom-30 -right-30 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl' />

            {/* CONDITIONAL RENDER: SHOW DETAIL VIEW */}
            {selectedAttempt ? (
                /* FIX 2: Set max-h-full and flex column to structure inner scroll regions nicely */
                <div className='relative z-10 w-full max-w-4xl max-h-full rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-white flex flex-col overflow-hidden'>

                    {/* Header Details */}
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 mb-6 gap-4 shrink-0'>
                        <div>
                            <button
                                onClick={() => setSelectedAttempt(null)}
                                className='text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-2 transition-colors'
                            >
                                ← Back to All Attempts
                            </button>
                            <h1 className='text-2xl md:text-3xl font-extrabold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                                {selectedAttempt.quizType === 'AI' ? 'AI Generated Quiz' : 'Predefined Quiz'} Details
                            </h1>
                            <p className='text-gray-400 text-sm mt-1'>
                                Taken on: {selectedAttempt.createdAt ? new Date(selectedAttempt.createdAt).toLocaleString() : '—'}
                            </p>
                        </div>

                        {/* Score Indicator */}
                        <div className='flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl self-start md:self-auto'>
                            <span className='text-gray-400 font-medium'>Score:</span>
                            <span className='px-4 py-1.5 bg-linear-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg'>
                                {selectedAttempt.correct} / {selectedAttempt.total}
                            </span>
                            <span className='text-2xl font-black text-cyan-400'>
                                {((selectedAttempt.correct / selectedAttempt.total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Questions Mapping */}
                    
                    <div className='flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10'>
                        {selectedAttempt.questions && selectedAttempt.questions.length > 0 ? (
                            selectedAttempt.questions.map((q, idx) => (
                                <div key={q.id || idx} className='rounded-2xl border border-white/5 bg-white/5 p-5 md:p-6 space-y-4'>
                                    <div className='flex items-start gap-3'>
                                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm'>
                                            {idx + 1}
                                        </span>
                                        <h3 className='text-base md:text-lg font-semibold text-gray-100 pt-0.5'>
                                            {q.question || "Question"}
                                        </h3>
                                    </div>

                                    {/* Answers Box */}
                                    <div className='pl-0 md:pl-10 space-y-3'>
                                        {/* Correct Answer Box (Always Green) */}
                                        <div className='p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm max-w-2xl'>
                                            <span className='block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1'>
                                                Correct Answer:
                                            </span>
                                            {q.options && q.correctAnswer !== undefined ? q.options[q.correctAnswer] : q.correctAnswer}
                                        </div>

                                        {/* Your Answer Box (Dynamically switches color based on accuracy) */}
                                        <div className={`p-4 rounded-xl border text-sm max-w-2xl ${q.userAnswer === q.correctAnswer
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                                : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                                            }`}>
                                            <span className={`block text-xs font-bold uppercase tracking-wider mb-1 ${q.userAnswer === q.correctAnswer ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                Your Answer: {q.userAnswer === q.correctAnswer ? '(Correct)' : '(Incorrect)'}
                                            </span>
                                            {q.options && q.userAnswer !== undefined ? (
                                                q.options[q.userAnswer] || <span className='italic text-gray-500'>No answer provided</span>
                                            ) : (
                                                q.userAnswer || <span className='italic text-gray-500'>No answer provided</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className='text-gray-400 text-center py-6 italic'>
                                Question logs were not saved for this legacy attempt.
                            </p>
                        )}
                    </div>

                    <div className='mt-6 border-t border-white/10 pt-4 shrink-0'>
                        <button
                            type='button'
                            onClick={() => setSelectedAttempt(null)}
                            className='w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center'
                        >
                            Back to History List
                        </button>
                    </div>

                </div>
            ) : (

                /* STANDARD MAIN ATTEMPTS CONTAINER LIST VIEW */
                /* FIX 4: Integrated structured maximum height constraints and inner-y scrolling to list frame too */
                <div className='relative z-10 w-full max-w-5xl max-h-full rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 flex flex-col overflow-hidden'>
                    
                    <div className='overflow-y-auto pr-2 space-y-8 scrollbar-thin scrollbar-thumb-white/10'>
                        {/* Heading */}
                        <div className='text-center mt-2'>
                            <h1 className='text-3xl md:text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4'>
                                Quiz History
                            </h1>
                            {user && <p className='text-gray-300 text-base md:text-lg'>{user.name} — view your past quiz attempts.</p>}
                        </div>

                        {/* Stats Summary Cards */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
                            <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6 md:p-8 text-center'>
                                <h2 className='text-4xl md:text-5xl font-extrabold text-cyan-400 mb-2 md:mb-3'>
                                    {totalAttempts === 0 ? '—' : `${averagePercentage.toFixed(1)}%`}
                                </h2>
                                <p className='text-gray-300 text-base md:text-lg'>Overall Average</p>
                            </div>
                            <div className='rounded-2xl bg-purple-500/10 border border-purple-500/20 p-6 md:p-8 text-center'>
                                <h2 className='text-4xl md:text-5xl font-extrabold text-purple-400 mb-2 md:mb-3'>{totalAttempts}</h2>
                                <p className='text-gray-300 text-base md:text-lg'>Total Attempts</p>
                            </div>
                        </div>

                        {/* History Items Loop */}
                        {attempts.length === 0 ? (
                            <div className='rounded-2xl bg-white/5 border border-white/10 p-8 text-center'>
                                <p className='text-gray-300 text-lg'>No quiz attempts yet.</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className='text-2xl md:text-3xl font-bold text-white mb-6'>Previous Attempts</h2>
                                <div className='space-y-4'>
                                    {attempts.map((attempt) => (
                                        <div
                                            key={attempt.id || attempt._id}
                                            onClick={() => setSelectedAttempt(attempt)}
                                            className='cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300'
                                        >
                                            <div>
                                                <h3 className='text-lg md:text-xl font-bold text-white mb-1md:mb-2'>
                                                    {attempt.quizType === 'AI' ? 'AI Quiz' : 'Predefined Quiz'}
                                                </h3>
                                                <p className='text-gray-400 text-sm'>
                                                    {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : '—'}
                                                </p>
                                                <span className='text-xs text-cyan-400 mt-2 block hover:underline'>
                                                    Click to view solutions →
                                               </span>
                                            </div>
                                            <div className='flex items-center justify-between md:justify-end gap-4 broad-layout'>
                                                <div className='px-4 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-purple-600 text-white font-bold text-base shadow-lg'>
                                                    {attempt.correct ?? 0} / {attempt.total ?? 0}
                                                </div>
                                                <div className='text-xl md:text-2xl font-extrabold text-cyan-400'>
                                                    {typeof attempt.percentage === 'number' ? `${attempt.percentage.toFixed(0)}%` : '0%'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Back to Dashboard Button */}
                    <div className='mt-6 shrink-0'>
                        <button
                            type='button'
                            onClick={handleDashboard}
                            className='w-full py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg text-white bg-linear-to-r from-cyan-500 to-purple-600 hover:scale-[1.01] active:scale-95 transition-all duration-300 shadow-lg'
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizHistory;