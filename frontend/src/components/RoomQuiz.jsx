import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { Link } from 'react-router-dom';
import {
    Home,
    ShieldCheck,
    ChevronDown,
    X
} from 'lucide-react';

const RoomQuiz = () => {

    const [roomId, setRoomId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [scoreData, setScoreData] = useState(null);

    const user = JSON.parse(localStorage.getItem('user')) || {};

    // Join Room
    const handleJoinRoom = async () => {

        if (!roomId.trim()) {
            setError('Please enter room ID');
            return;
        }

        setLoading(true);
        setError('');

        try {

            const res = await axios.get(`${API_URL}/api/room/id`, {
                params: { roomId }
            });

            setRoom(res.data);
            setUserAnswers(new Array(res.data.questions.length).fill(null));

        } catch (err) {

            setError(err.response?.data?.message || 'Room not found');

        } finally {

            setLoading(false);

        }
    };

    // Select Answer
    const handleSelectAnswer = (index) => {

        const updated = [...userAnswers];
        updated[currentQuestion] = index;
        setUserAnswers(updated);

    };

    // Next Question
    const handleNext = async () => {

        if (currentQuestion < room.questions.length - 1) {

            setCurrentQuestion(currentQuestion + 1);

        } else {

            await finishQuiz();

        }
    };

    // Back Question
    const handleBack = () => {

        if (currentQuestion > 0) {

            setCurrentQuestion(currentQuestion - 1);

        }
    };

    // Finish Quiz
    const finishQuiz = async () => {

        let correct = 0;

        const formattedQuestions = room.questions.map((q, index) => {

            const chosenAnswer = userAnswers[index];

            if (chosenAnswer === q.correctAnswer) {
                correct++;
            }

            return {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                userAnswer: chosenAnswer,
                explanation: q.explanation || '',
                topic: q.topic || 'General Room Quiz'
            };
        });

        const total = room.questions.length;
        const percentage = Math.round((correct / total) * 100);

        const roomPayload = {
            userId: user.id,
            userName: user.name,
            correct,
            total,
            percentage,
        };

        const historyPayload = {
            userId: user.id,
            quizType: "General Room Quiz",
            correct,
            total,
            percentage: parseFloat(percentage),
            questions: formattedQuestions
        };

        try {

            await axios.post(`${API_URL}/api/room/quiz-attempt`, roomPayload, {
                params: { roomId }
            });

            await axios.post(`${API_URL}/api/quiz-attempts`, historyPayload);

            setScoreData({
                correct,
                total,
                percentage,
            });

            setShowResult(true);

        } catch (err) {

            console.error('Error saving quiz updates:', err);
            setError('Failed to save quiz results securely to user history.');

        }
    };

    // RESULT SCREEN
    if (showResult && scoreData) {

        return (

            <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center px-4 py-10'>

                {/* Glow */}
                <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

                {/* Main Card */}
                <div className='relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-center'>

                    <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-10'>
                        Quiz Completed 🎉
                    </h1>

                    {/* Score Circle */}
                    <div className='flex justify-center mb-10'>
                        <div className='w-44 h-44 rounded-full bg-linear-to-r from-cyan-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl'>
                            <h2 className='text-5xl font-extrabold text-white'>
                                {scoreData.percentage}%
                            </h2>
                            <p className='text-white font-semibold mt-2'>
                                Your Score
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-12'>

                        <div className='rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-emerald-400'>
                                {scoreData.correct}
                            </h2>
                            <p className='text-gray-300'>Correct</p>
                        </div>

                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-red-400'>
                                {scoreData.total - scoreData.correct}
                            </h2>
                            <p className='text-gray-300'>Incorrect</p>
                        </div>

                        <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-cyan-400'>
                                {scoreData.total}
                            </h2>
                            <p className='text-gray-300'>Total</p>
                        </div>

                    </div>

                    <hr className='border-white/10 mb-10' />

                    {/* Review */}
                    <div className='text-left space-y-8'>

                        <h2 className='text-2xl font-bold text-white mb-6 text-center md:text-left'>
                            Review Answers
                        </h2>

                        {room.questions.map((q, qIdx) => {

                            const isCorrect = userAnswers[qIdx] === q.correctAnswer;

                            return (

                                <div
                                    key={qIdx}
                                    className={`rounded-2xl border p-5 md:p-6 bg-white/5 space-y-4 ${isCorrect
                                        ? 'border-emerald-500/30'
                                        : 'border-red-500/30'
                                        }`}
                                >

                                    <div className='flex flex-col md:flex-row md:items-start justify-between gap-3'>

                                        <h3 className='text-xl font-bold text-white leading-relaxed'>
                                            <span className='text-gray-400 font-medium mr-2'>
                                                {qIdx + 1}.
                                            </span>
                                            {q.question}
                                        </h3>

                                        <span className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase ${isCorrect
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>

                                    <div className='grid grid-cols-1 gap-3 pt-2'>

                                        {q.options.map((opt, optIdx) => {

                                            const isSelected = userAnswers[qIdx] === optIdx;
                                            const isTargetAnswer = q.correctAnswer === optIdx;

                                            let optionStyles = "bg-white/5 border-white/10 text-gray-300";

                                            if (isTargetAnswer) {
                                                optionStyles = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold";
                                            } else if (isSelected && !isTargetAnswer) {
                                                optionStyles = "bg-red-500/20 border-red-500/50 text-red-300 font-bold";
                                            }

                                            return (

                                                <div
                                                    key={optIdx}
                                                    className={`flex items-center justify-between border px-5 py-3.5 rounded-xl text-base ${optionStyles}`}
                                                >

                                                    <span>{opt}</span>

                                                    {isTargetAnswer && (
                                                        <span className='text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold'>
                                                            Correct Answer
                                                        </span>
                                                    )}

                                                    {isSelected && !isTargetAnswer && (
                                                        <span className='text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-semibold'>
                                                            Your Choice
                                                        </span>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // QUIZ SCREEN
    if (room) {

        const question = room.questions[currentQuestion];

        return (

            <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 pt-28 pb-10'>

                {/* Glow */}
                <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

                {/* Header */}

                {/* Quiz Card */}
                <div className='relative z-10 flex justify-center'>

                    <div className='w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>

                        {/* Top */}
                        <div className='flex justify-between items-center mb-10 gap-4'>

                            <h2 className='text-cyan-400 text-xl font-bold'>
                                Question {currentQuestion + 1} of {room.questions.length}
                            </h2>

                            <div className='text-purple-400 font-semibold text-right'>
                                {room.title}
                            </div>

                        </div>

                        {/* Question */}
                        <h1 className='text-3xl font-bold text-white mb-10 leading-relaxed'>
                            {question.question}
                        </h1>

                        {/* Options */}
                        <div className='flex flex-col gap-4 mb-10'>

                            {question.options.map((opt, index) => (

                                <button
                                    key={index}
                                    onClick={() => handleSelectAnswer(index)}
                                    className={`w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300 font-semibold text-lg ${userAnswers[currentQuestion] === index
                                        ? 'bg-linear-to-r from-cyan-500 to-purple-600 text-white border-transparent'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    {opt}
                                </button>

                            ))}

                        </div>

                        {/* Actions */}
                        <div className='flex gap-5'>

                            <button
                                onClick={handleBack}
                                disabled={currentQuestion === 0}
                                className='flex-1 py-4 rounded-2xl font-bold text-lg text-white bg-linear-to-r from-gray-600 to-gray-800 disabled:opacity-40'
                            >
                                Back
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={userAnswers[currentQuestion] === null}
                                className='flex-1 py-4 rounded-2xl font-bold text-lg text-white bg-linear-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-40'
                            >
                                {currentQuestion === room.questions.length - 1
                                    ? 'Finish'
                                    : 'Next'}
                            </button>

                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // JOIN ROOM SCREEN
    return (

        <div className='relative min-h-screen overflow-hidden flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950 px-4'>

            {/* Glow */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

            <>
                <header className='fixed top-0 left-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-md'>

                    <div className='px-0 md:px-10 flex items-center gap-6'>

                        {/* Logo */}
                        <div className='flex items-center gap-2 font-black text-xl tracking-wide text-white'>

                            <span className='bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 p-1.5 rounded-lg text-white inline-flex items-center justify-center'>

                                <svg className='w-5 h-5 fill-current' viewBox='0 0 24 24'>
                                    <path d='M19 11h-6V3a1 1 0 0 0-1.707-.707l-9 9a1 1 0 0 0 .707 1.707h6v8a1 1 0 0 0 1.707.707l9-9A1 1 0 0 0 19 11z' />
                                </svg>

                            </span>

                            Quiz App

                        </div>

                        {/* Nav (Desktop Only) */}
                        <nav className='hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400'>

                            <Link
                                to='/dashboard'
                                className='flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition'
                            >
                                <Home className='w-4 h-4' />
                                Dashboard
                            </Link>

                            {user?.role === 'admin' && (

                                <Link
                                    to='/admin'
                                    className='flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition'
                                >
                                    <ShieldCheck className='w-4 h-4' />
                                    Admin
                                </Link>

                            )}

                        </nav>
                    </div>

                    {/* Profile Element (Click handler opens menu on mobile, or can toggle drawer) */}
                    {user && (

                        <div
                            onClick={() => setIsSidebarOpen(true)}
                            className='flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition cursor-pointer'
                        >

                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                alt='Avatar'
                                className='w-8 h-8 rounded-full bg-slate-800 border border-white/20'
                            />

                            <div className='hidden sm:block text-left'>
                                <p className='text-[10px] text-gray-400 leading-none'>
                                    Welcome,
                                </p>
                                <p className='text-xs font-semibold text-gray-200'>
                                    {user.name}
                                </p>
                            </div>

                            <ChevronDown className='w-3.5 h-3.5 text-gray-400' />

                        </div>
                    )}

                </header>

                {/* Responsive Mobile Drawer Menu */}
                <div
                    className={`fixed inset-0 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    {/* Backdrop Overlay filter */}
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className='absolute inset-0 bg-black/60 backdrop-blur-xs'
                    />

                    {/* Sidebar Content Panel */}
                    <div
                        className={`absolute top-0 right-0 h-full w-72 max-w-[80vw] border-l border-white/10 bg-slate-950/90 backdrop-blur-xl p-6 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                    >
                        {/* Header within Drawer */}
                        <div className='flex items-center justify-between pb-6 border-b border-white/5 mb-6'>
                            <div className='flex items-center gap-3'>
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                    alt='Avatar'
                                    className='w-10 h-10 rounded-full bg-slate-800 border border-white/20'
                                />
                                <div className='text-left'>
                                    <p className='text-[10px] text-gray-400 leading-none'>User Profile</p>
                                    <p className='text-sm font-bold text-white mt-1'>{user?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className='p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        {/* Mobile Navigation List Actions */}
                        <nav className='flex flex-col gap-3 text-base font-semibold'>
                            <Link
                                to='/dashboard'
                                onClick={() => setIsSidebarOpen(false)}
                                className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 active:bg-blue-600/20 transition'
                            >
                                <Home className='w-5 h-5' />
                                Dashboard
                            </Link>

                            {user?.role === 'admin' && (
                                <Link
                                    to='/admin'
                                    onClick={() => setIsSidebarOpen(false)}
                                    className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 text-gray-200 border border-white/5 hover:bg-white/10 active:scale-98 transition'
                                >
                                    <ShieldCheck className='w-5 h-5 text-purple-400' />
                                    Admin Panel
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </>

            {/* Card */}
            <div className='relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>

                <div className='text-center mb-10'>

                    <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5'>
                        Join Quiz Room
                    </h1>

                    <p className='text-gray-300 text-lg'>
                        Enter Room ID to Start Quiz
                    </p>

                </div>

                <div className='space-y-6'>

                    <input
                        type='text'
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder='Enter Room ID'
                        className='w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-white placeholder-gray-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30'
                    />

                    {error && (

                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400'>
                            {error}
                        </div>

                    )}

                    <button
                        onClick={handleJoinRoom}
                        disabled={loading}
                        className='w-full py-5 rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-[#101e4a] to-[#07366b] border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50'
                    >
                        {loading ? 'Joining Room...' : 'Start Quiz'}
                    </button>

                </div>

            </div>
        </div>
    );
};

export default RoomQuiz;