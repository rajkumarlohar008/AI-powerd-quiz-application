import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import Nav from './Nav';

const Result = ({ questions, userAnswers }) => {

    const navigate = useNavigate();

    const savedRef = useRef(false);
    const token = localStorage.getItem('token') || '';
    const [scoreData, setScoreData] = useState(null);

    // Calculate Score
    const calculateScore = () => {

        let correct = 0;
        let incorrect = 0;

        questions.forEach((question, index) => {

            if (
                userAnswers[index] ===
                question.correctAnswer
            ) {

                correct++;

            } else {

                incorrect++;
            }
        });

        return {
            correct,
            incorrect,
            total: questions.length
        };
    };

    const score = calculateScore();

    const percentage = Math.round(
        (score.correct / score.total) * 100
    );

    // Save Quiz Attempt
    useEffect(() => {

        if (
            savedRef.current ||
            !questions?.length
        ) {
            return;
        }

        const user = JSON.parse(
            localStorage.getItem('user') || '{}'
        );

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

                userAnswer:
                    userAnswers[index] ?? null,

                explanation: null,

                topic: null,

            })),
        };

        axios.post(
            `${API_URL}/api/quiz-attempts`,
            payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        ).catch(() => { });

    }, [
        questions,
        userAnswers,
        score.correct,
        score.total,
        percentage
    ]);

    // Retake Quiz
    const handleRetake = () => {
        window.location.reload();
    };

    // Dashboard
    const handleDashboard = () => {
        navigate('/dashboard');
    };

    return (

        <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center px-4 py-10'>

                {/* Glow */}
                <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

                <Nav />
                {/* Main Card */}
                <div className='mt-15 relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-center'>

                    <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-10'>
                        Quiz Completed 🎉
                    </h1>

                    {/* Score Circle */}
                    <div className='flex justify-center mb-10'>
                        <div className='w-44 h-44 rounded-full bg-linear-to-r from-cyan-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl'>
                            <h2 className='text-5xl font-extrabold text-white'>
                                {percentage}%
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
                                {score.correct}
                            </h2>
                            <p className='text-gray-300'>Correct</p>
                        </div>

                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-red-400'>
                                {score.total - score.correct}
                            </h2>
                            <p className='text-gray-300'>Incorrect</p>
                        </div>

                        <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6'>
                            <h2 className='text-4xl font-bold text-cyan-400'>
                                {score.total}
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

                        {questions.map((q, qIdx) => {

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
                    <div className='mt-8 w-full'>
                        <Link
                            to='/dashboard'
                            
                            className='px-17 mt-8 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
    );
};

export default Result;