import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

const RoomQuiz = () => {
    const [roomId, setRoomId] = useState('');
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

    // Finish Quiz & Save Results To Both Endpoints
    const finishQuiz = async () => {
        let correct = 0;

        // 1. Calculate stats and transform questions array dynamically into the target backend DTO schema
        const formattedQuestions = room.questions.map((q, index) => {
            const chosenAnswer = userAnswers[index];
            if (chosenAnswer === q.correctAnswer) {
                correct++;
            }

            return {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                userAnswer: chosenAnswer,               // Selected choice index (supports null for skipped fields)
                explanation: q.explanation || '',        // Fallback safety string 
                topic: q.topic || 'General Room Quiz'    // Fallback safety string
            };
        });

        const total = room.questions.length;
        const percentage = Math.round((correct / total) * 100);

        // 2. Setup the Room Save payload
        const roomPayload = {
            userId: user.id,
            userName: user.name,
            correct,
            total,
            percentage,
        };

        // 3. Setup the Global User History Save payload (matches SaveQuizAttemptRequest DTO)
        const historyPayload = {
            userId: user.id,
            quizType: "General Room Quiz", 
            correct,
            total,
            percentage: parseFloat(percentage),
            questions: formattedQuestions
        };

        try {
            // Target API Call A: Persist user's direct responses within the active room context
            await axios.post(`${API_URL}/api/room/quiz-attempt`, roomPayload, {
                params: { roomId }
            });

            // Target API Call B: Persist structural details to user history dashboard service 
            await axios.post(`${API_URL}/api/quiz-attempts`, historyPayload);

            // Sync state arrays cleanly to render detailed scorecard markup updates
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

    // RESULT SCREEN (WITH DETAILED QUESTION REVIEW)
    if (showResult && scoreData) {
        return (
            <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center px-4 py-10'>
                {/* Glow Background Elements */}
                <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

                {/* Main Results Card Container */}
                <div className='relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-center'>
                    <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-10'>
                        Quiz Completed 🎉
                    </h1>

                    {/* Score Circle */}
                    <div className='flex justify-center mb-10'>
                        <div className='w-44 h-44 rounded-full bg-linear-to-r from-cyan-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl'>
                            <h2 className='text-5xl font-extrabold text-white'>{scoreData.percentage}%</h2>
                            <p className='text-white font-semibold mt-2'>Your Score</p>
                        </div>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-12'>
                        <div className='rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-emerald-400'>{scoreData.correct}</h2>
                            <p className='text-gray-300'>Correct</p>
                        </div>
                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-red-400'>{scoreData.total - scoreData.correct}</h2>
                            <p className='text-gray-300'>Incorrect</p>
                        </div>
                        <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-cyan-400'>{scoreData.total}</h2>
                            <p className='text-gray-300'>Total</p>
                        </div>
                    </div>

                    <hr className="border-white/10 mb-10" />

                    {/* Detailed Question Review Section */}
                    <div className="text-left space-y-8">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center md:text-left">
                            Review Answers
                        </h2>
                        
                        {room.questions.map((q, qIdx) => {
                            const isCorrect = userAnswers[qIdx] === q.correctAnswer;
                            return (
                                <div 
                                    key={qIdx} 
                                    className={`rounded-2xl border p-5 md:p-6 bg-white/5 space-y-4 transition-all ${
                                        isCorrect ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                                    }`}
                                >
                                    {/* Question Text and Status Tag */}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                        <h3 className="text-xl font-bold text-white leading-relaxed">
                                            <span className="text-gray-400 font-medium mr-2">{qIdx + 1}.</span>
                                            {q.question}
                                        </h3>
                                        <span className={`self-start px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                                            isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                    </div>

                                    {/* Interactive Options Visualizer */}
                                    <div className="grid grid-cols-1 gap-3 pt-2">
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
                                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                                                            Correct Answer
                                                        </span>
                                                    )}
                                                    {isSelected && !isTargetAnswer && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-semibold">
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
            <div className='relative min-h-screen overflow-hidden flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 py-10'>
                {/* Glow */}
                <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

                {/* Quiz Card */}
                <div className='relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>
                    {/* Header */}
                    <div className='flex justify-between items-center mb-10'>
                        <h2 className='text-cyan-400 text-xl font-bold'>
                            Question {currentQuestion + 1} of {room.questions.length}
                        </h2>
                        <div className='text-purple-400 font-semibold'>{room.title}</div>
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
                                className={`w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300 font-semibold text-lg ${
                                    userAnswers[currentQuestion] === index
                                        ? `bg-linear-to-r from-cyan-500 to-purple-600 text-white border-transparent`
                                        : `bg-white/5 border-white/10 text-gray-300 hover:bg-white/10`
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
                            {currentQuestion === room.questions.length - 1 ? 'Finish' : 'Next'}
                        </button>
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

            {/* Card */}
            <div className='relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>
                {/* Heading */}
                <div className='text-center mb-10'>
                    <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5'>
                        Join Quiz Room
                    </h1>
                    <p className='text-gray-300 text-lg'>Enter Room ID to Start Quiz</p>
                </div>

                {/* Input */}
                <div className='space-y-6'>
                    <input
                        type='text'
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder='Enter Room ID'
                        className='w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-white placeholder-gray-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30'
                    />

                    {/* Error */}
                    {error && (
                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400'>
                            {error}
                        </div>
                    )}

                    {/* Join Button */}
                    <button
                        onClick={handleJoinRoom}
                        disabled={loading}
                        className='w-full py-5 rounded-2xl font-bold text-xl text-white bg-linear-to-r from-cyan-500 via-blue-500 to-purple-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] disabled:opacity-50'
                    >
                        {loading ? 'Joining Room...' : 'Start Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomQuiz;