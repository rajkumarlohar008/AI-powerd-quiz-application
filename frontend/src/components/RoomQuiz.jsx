import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck, ChevronDown, X } from 'lucide-react';
import Result from './Result';
import QuizScreen from './QuizScreen'; 

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
    const [timeLeft, setTimeLeft] = useState(30);
    const [timeTaken, setTimeTaken] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Use a ref to keep track of submission state instantly for the timer interval closure
    const isSubmittingRef = useRef(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const token = localStorage.getItem('token') || '';

    const handleNextClick = async () => {
        if (!room) return;
        // Last question
        if (currentQuestion === room.questions.length - 1) {
            setIsSubmitting(true);
            isSubmittingRef.current = true;
            try {
                await handleNext();
            } finally {
                setIsSubmitting(false);
                isSubmittingRef.current = false;
            }
        } else {
            handleNext();
        }
    };

    // Join Room
    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            setError('Please enter room ID');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.get(`${API_URL}/api/getRoom/id`, {
                params: { roomId },
                headers: { Authorization: `Bearer ${token}` }
            });

            setRoom(res.data);
            setTimeLeft(30);
            setCurrentQuestion(0);
            setTimeTaken(0);
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

    // Next Question Logic
    const handleNext = async () => {
        if (!room) return;

        // Calculate time spent on the current question
        const secondsSpentOnThisQuestion = 30 - timeLeft;
        setTimeTaken(prevTime => prevTime + secondsSpentOnThisQuestion);

        if (currentQuestion < room.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setTimeLeft(30);
        } else {
            // Last question completed, proceed to finish
            await finishQuiz();
        }
    };

    // Timer handling with clean closures
    useEffect(() => {
        if (loading || showResult || !room || isSubmitting) return;

        const timer = setInterval(() => {
            // Guard against running timer updates while a submission api request is active
            if (isSubmittingRef.current) return;

            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestion, loading, showResult, room, timeLeft, isSubmitting]);

    // Back Question
    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setTimeLeft(30);
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

        // Calculate final total time snapshot safely inside the updater context
        const finalTimeTaken = timeTaken + (30 - timeLeft);

        const roomPayload = {
            userId: user.id,
            userName: user.name,
            correct,
            total,
            percentage,
            timeTaken: finalTimeTaken
        };

        try {
            // 1. Submit custom room performance tracking payload
            await axios.post(`${API_URL}/api/quizRoom/quiz-attempt`, roomPayload, {
                params: { roomId },
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Set data locally to display screens cleanly
            setScoreData({ correct, total, percentage });
            setShowResult(true);
        } catch (err) {
            console.error('Error saving quiz updates:', err);
            setError('Failed to save quiz results securely to user history.');
        }
    };

    const universalBack = ()=>{

        setRoom(null);
        setTimeLeft(30);
        setShowResult(false);
        
    };

    // RESULT SCREEN
    if (showResult && scoreData) {
        return <Result questions={room.questions} userAnswers={userAnswers} title={room.roomName} quizType="General Room Quiz" onUniversalBack={universalBack}/>;
    }

    // QUIZ SCREEN
    if (room) {
        const question = room.questions[currentQuestion];
        return (
            <QuizScreen 
                currentQuestion={currentQuestion}
                totalQuestions={room.questions.length}
                questionData={question}
                selectedAnswer={userAnswers[currentQuestion]}
                onSelectAnswer={handleSelectAnswer}
                onNext={handleNextClick}
                onBack={handleBack}
                isNextDisabled={userAnswers[currentQuestion] === null || (currentQuestion === room.questions.length - 1 && isSubmitting) }
                isBackDisabled={currentQuestion === 0}
                nextText={currentQuestion === room.questions.length - 1 ? (isSubmitting ? 'Submitting...' : 'Finish') : 'Next'}
                title={room.roomName}
                timeLeft={timeLeft}
                onUniversalBack={universalBack}
            />
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
                        className=' py-5  text-xl  duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50
                        
                        px-17  w-full  rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                    >
                        {loading ? 'Joining Room...' : 'Start Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomQuiz;