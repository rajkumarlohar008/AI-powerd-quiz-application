import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { Undo2 } from 'lucide-react';

// Added quizType as an optional prop with a default value of 'PREDEFINED'
const Result = ({ questions, userAnswers, quizType = 'PREDEFINED', title, summary, recommendation, onUniversalBack }) => {

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
                question.answerIndex || question.correctAnswer  
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
            !questions?.length || title === questions[0].topic
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

            quizType: title || quizType, // Use the dynamic prop here

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
        percentage,
        quizType // added to dependencies
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

        <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center px-4 py-10 w-full'>

            {/* Glow */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

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
                <div className='text-left space-y-8 flex flex-col'>

                    <div className='flex justify-between'>
                        <h2 className='text-2xl font-bold text-white mb-6 text-center md:text-left'>
                            Review Answers
                        </h2>
                        <Undo2
                            onClick={onUniversalBack}
                            className='w-7 h-7 text-white hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                            size={32}
                        />
                    </div>
                    {summary && (
                        <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-8'>
                            <h2 className='text-2xl font-bold text-white mb-4 tracking-wide'>Overall Feedback</h2>
                            <p className='text-gray-300 leading-relaxed'>{summary}</p>
                        </div>
                    )}

                    {recommendation && (
                        <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-10'>
                            <h2 className='text-2xl font-bold text-white mb-4 tracking-wide'>Recommendations</h2>
                            <ul className='list-disc list-inside text-gray-300 space-y-3'>
                                {recommendation.map((r, idx) => (
                                    <li key={idx} className='leading-relaxed'>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}


                    {questions.map((q, idx) => {
                        const userIdx = userAnswers[idx];
                        const correctIdx = q.answerIndex || q.correctAnswer;
                        const isCorrect = userIdx === correctIdx;
                        const userAnswerText = userIdx !== null && userIdx !== undefined ? q.options[userIdx] : 'Not answered';
                        const correctAnswerText = q.options[correctIdx];

                        return (
                            <div key={idx} className={`rounded-xl border p-5 relative overflow-hidden ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.02)]' : 'bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.02)]'}`}>
                                <div className={`absolute top-4 right-4 font-bold text-sm px-3 py-1 rounded-full border ${isCorrect ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </div>
                                <h3 className='text-lg font-bold text-white pr-24 mb-4 leading-relaxed'>Q{idx + 1}: {q.question}</h3>
                                <div className='space-y-2.5 text-sm md:text-base'>
                                    <p className='text-gray-300'>
                                        <strong className='text-white font-semibold'>Your Answer: </strong>
                                        <span className={isCorrect ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{userAnswerText}</span>
                                    </p>
                                    {!isCorrect && (
                                        <p className='text-gray-300'>
                                            <strong className='text-white font-semibold'>Correct Answer: </strong>
                                            <span className='text-emerald-400 font-medium'>{correctAnswerText}</span>
                                        </p>
                                    )}
                                    {q.explanation && (
                                        <p className='text-gray-400 mt-4 pt-3 border-t border-white/5 bg-black/20 p-3 rounded-xl text-sm italic leading-relaxed'>
                                            <strong className='text-gray-200 not-italic font-semibold block mb-1'>Explanation:</strong>
                                            {q.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <Link
                        to='/dashboard'

                        className='self-center w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Result;