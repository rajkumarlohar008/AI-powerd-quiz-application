import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { Download, Undo2 } from 'lucide-react';

const Result = ({
    questions,
    userAnswers,
    quizType = 'PREDEFINED',
    title,
    summary,
    recommendation,
    onUniversalBack,
    roomCertificate,
    hideReview = false,
}) => {
    const savedRef = useRef(false);
    const token = localStorage.getItem('token') || '';

    const [certAllowed, setCertAllowed] = useState(Boolean(roomCertificate?.initiallyAllowed));
    const [certLoading, setCertLoading] = useState(false);
    const [certDownloading, setCertDownloading] = useState(false);
    const [certMessage, setCertMessage] = useState('');

    const checkIsCorrect = (question, index) => {
        const userIdx = userAnswers[index];
        const correctIdx = question.answerIndex !== undefined && question.answerIndex !== null
            ? question.answerIndex
            : question.correctAnswer;

        if (userIdx === null || userIdx === undefined) return false;
        return userIdx === correctIdx;
    };

    const calculateScore = () => {
        let correct = 0;
        let incorrect = 0;

        (questions || []).forEach((question, index) => {
            if (checkIsCorrect(question, index)) {
                correct++;
            } else {
                incorrect++;
            }
        });

        return {
            correct,
            incorrect,
            total: (questions || []).length
        };
    };

    const score = calculateScore();

    const percentage = score.total > 0
        ? Math.round((score.correct / score.total) * 100)
        : 0;

    const refreshCertificateStatus = useCallback(async () => {
        if (!roomCertificate?.roomId || !roomCertificate?.email) return;
        setCertLoading(true);
        setCertMessage('');
        try {
            const res = await axios.get(`${API_URL}/api/quizRoom/attempt-status`, {
                params: {
                    roomId: roomCertificate.roomId,
                    email: roomCertificate.email,
                },
            });
            setCertAllowed(Boolean(res.data?.certificateAllowed));
            if (!res.data?.certificateAllowed) {
                setCertMessage('Waiting for admin approval to download your certificate.');
            } else {
                setCertMessage('Your certificate is ready to download.');
            }
        } catch {
            setCertMessage('Could not check certificate status.');
        } finally {
            setCertLoading(false);
        }
    }, [roomCertificate?.roomId, roomCertificate?.email]);

    useEffect(() => {
        if (roomCertificate?.roomId && roomCertificate?.email) {
            refreshCertificateStatus();
            const interval = setInterval(refreshCertificateStatus, 15000);
            return () => clearInterval(interval);
        }
    }, [roomCertificate?.roomId, roomCertificate?.email, refreshCertificateStatus]);

    const downloadCertificate = async () => {
        if (!roomCertificate?.roomId || !roomCertificate?.email) return;
        setCertDownloading(true);
        setCertMessage('');
        try {
            const res = await axios.get(`${API_URL}/api/quizRoom/certificate`, {
                params: {
                    roomId: roomCertificate.roomId,
                    email: roomCertificate.email,
                },
                responseType: 'blob',
            });

            const contentType = res.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                const text = await res.data.text();
                const json = JSON.parse(text);
                setCertMessage(json.message || 'Certificate not available yet.');
                setCertAllowed(false);
                return;
            }

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate_${(title || 'quiz').replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setCertMessage('Certificate downloaded successfully.');
        } catch (err) {
            const data = err.response?.data;
            if (data instanceof Blob) {
                try {
                    const text = await data.text();
                    const json = JSON.parse(text);
                    setCertMessage(json.message || 'Failed to download certificate.');
                } catch {
                    setCertMessage('Failed to download certificate.');
                }
            } else {
                setCertMessage(err.response?.data?.message || 'Failed to download certificate.');
            }
        } finally {
            setCertDownloading(false);
        }
    };

    useEffect(() => {
        if (
            savedRef.current ||
            !questions?.length ||
            hideReview ||
            title === questions[0]?.topic
        ) {
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        savedRef.current = true;

        const payload = {
            userId: user.id,
            quizType: title || quizType,
            correct: score.correct,
            total: score.total,
            percentage,
            questions: questions.map((q, index) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.answerIndex !== undefined && q.answerIndex !== null ? q.answerIndex : q.correctAnswer,
                userAnswer: userAnswers[index] ?? null,
                explanation: q.explanation || null,
                topic: q.topic || null,
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
        quizType,
        title,
        token,
        hideReview,
    ]);

    if (hideReview && roomCertificate) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-amber-100/90">
                    {certLoading
                        ? 'Checking certificate status...'
                        : certMessage || (certAllowed
                            ? 'Your certificate is ready.'
                            : 'Waiting for admin to allow certificate download.')}
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={refreshCertificateStatus}
                        disabled={certLoading}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 border border-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                    >
                        Refresh Status
                    </button>
                    <button
                        type="button"
                        onClick={downloadCertificate}
                        disabled={!certAllowed || certDownloading}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-40 inline-flex items-center gap-2"
                    >
                        <Download size={14} />
                        {certDownloading ? 'Downloading...' : 'Download Certificate'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='relative min-h-screen overflow-y-auto theme-page-bg flex items-center justify-center px-4 py-10 w-full'>

            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

            <div className='mt-15 relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-center'>

                <h1 className='text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-10'>
                    Quiz Completed 🎉
                </h1>

                <div className='flex justify-center mb-10'>
                    <div className='w-44 h-44 rounded-full bg-linear-to-r from-cyan-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl keep-white'>
                        <h2 className='text-5xl font-extrabold text-white'>
                            {percentage}%
                        </h2>
                        <p className='text-white font-semibold mt-2'>
                            Your Score
                        </p>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-12'>

                    <div className='rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6'>
                        <h2 className='text-4xl font-bold text-emerald-400'>
                            {score.correct}
                        </h2>
                        <p className='text-gray-300'>Correct</p>
                    </div>

                    <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-6'>
                        <h2 className='text-4xl font-bold text-red-400'>
                            {score.incorrect}
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

                {roomCertificate && (
                    <div className='mb-10 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5 text-left space-y-3'>
                        <h3 className='text-lg font-bold text-white'>Completion Certificate</h3>
                        <p className='text-sm text-gray-300'>
                            {certLoading
                                ? 'Checking certificate status...'
                                : certMessage || 'After the admin reviews your attempt and grants permission, you can download your PDF certificate here.'}
                        </p>
                        <div className='flex flex-wrap gap-3'>
                            <button
                                type="button"
                                onClick={refreshCertificateStatus}
                                disabled={certLoading}
                                className='px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 border border-white/10 text-white hover:bg-white/20 disabled:opacity-50'
                            >
                                Refresh Status
                            </button>
                            <button
                                type="button"
                                onClick={downloadCertificate}
                                disabled={!certAllowed || certDownloading}
                                className='px-4 py-2.5 rounded-xl text-sm font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-40 inline-flex items-center gap-2'
                            >
                                <Download size={16} />
                                {certDownloading ? 'Downloading...' : 'Download PDF Certificate'}
                            </button>
                        </div>
                    </div>
                )}

                <hr className='border-white/10 mb-10' />

                {!hideReview && (
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

                    {(questions || []).map((q, idx) => {
                        const userIdx = userAnswers[idx];
                        const correctIdx = q.answerIndex !== undefined && q.answerIndex !== null ? q.answerIndex : q.correctAnswer;
                        const isCorrect = checkIsCorrect(q, idx);

                        const userAnswerText = userIdx !== null && userIdx !== undefined ? q.options[userIdx] : 'Not answered';
                        const correctAnswerText = q.options[correctIdx] !== undefined ? q.options[correctIdx] : 'N/A';

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
                )}
            </div>
        </div>
    );
};

export default Result;
