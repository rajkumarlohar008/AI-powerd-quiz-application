import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import Result from './Result';
import QuizScreen from './QuizScreen';

const GUEST_STORAGE_KEY = 'guestParticipant';

const readGuestParticipant = () => {
    try {
        return JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const RoomQuiz = () => {
    const [searchParams] = useSearchParams();

    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token') || '';
    const isLoggedIn = Boolean(token && loggedInUser?.email);

    const [roomId, setRoomId] = useState(() => searchParams.get('roomId') || '');
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
    const [alreadyAttempted, setAlreadyAttempted] = useState(false);
    const [attemptInfo, setAttemptInfo] = useState(null);

    const guest = readGuestParticipant();
    const [participantName, setParticipantName] = useState(
        isLoggedIn ? (loggedInUser.name || '') : (guest.name || '')
    );
    const [participantEmail, setParticipantEmail] = useState(
        isLoggedIn ? (loggedInUser.email || '') : (guest.email || '')
    );
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestFormName, setGuestFormName] = useState('');
    const [guestFormEmail, setGuestFormEmail] = useState('');
    const [guestFormError, setGuestFormError] = useState('');

    const isSubmittingRef = useRef(false);

    const getAuthHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

    const getParticipant = () => {
        if (isLoggedIn) {
            return {
                name: loggedInUser.name || '',
                email: loggedInUser.email || '',
            };
        }
        if (participantName.trim() && participantEmail.trim()) {
            return {
                name: participantName.trim(),
                email: participantEmail.trim(),
            };
        }
        return null;
    };

    useEffect(() => {
        const idFromUrl = searchParams.get('roomId');
        if (idFromUrl) {
            setRoomId(idFromUrl);
        }
    }, [searchParams]);

    const checkAttemptStatus = async (email, id) => {
        if (!email || !id) return null;
        try {
            const res = await axios.get(`${API_URL}/api/quizRoom/attempt-status`, {
                params: { roomId: id, email },
            });
            return res.data;
        } catch {
            return null;
        }
    };

    const handleNextClick = async () => {
        if (!room) return;
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

    const joinRoomRequest = async () => {
        setLoading(true);
        setError('');
        setAlreadyAttempted(false);
        setAttemptInfo(null);

        const participant = getParticipant();

        try {
            if (participant?.email) {
                const status = await checkAttemptStatus(participant.email, roomId);
                if (status?.alreadyAttempted) {
                    setAlreadyAttempted(true);
                    setAttemptInfo(status);
                    setError('You have already completed this room quiz. Only one attempt is allowed.');
                    setLoading(false);
                    return;
                }
            }

            const res = await axios.get(`${API_URL}/api/getRoom/id`, {
                params: { roomId },
                headers: getAuthHeaders(),
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

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            setError('Please enter room ID');
            return;
        }

        const participant = getParticipant();
        if (!participant) {
            setGuestFormName(participantName);
            setGuestFormEmail(participantEmail);
            setGuestFormError('');
            setShowGuestModal(true);
            return;
        }

        await joinRoomRequest();
    };

    const handleGuestContinue = async () => {
        const name = guestFormName.trim();
        const email = guestFormEmail.trim();

        if (!name || !email) {
            setGuestFormError('Please enter your name and email');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setGuestFormError('Please enter a valid email');
            return;
        }

        const guestData = { name, email };
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
        setParticipantName(name);
        setParticipantEmail(email);
        setShowGuestModal(false);
        setGuestFormError('');
        setError('');

        if (!roomId.trim()) {
            setError('Please enter room ID');
            return;
        }

        await joinRoomRequest();
    };

    const handleSelectAnswer = (index) => {
        const updated = [...userAnswers];
        updated[currentQuestion] = index;
        setUserAnswers(updated);
    };

    const handleNext = async () => {
        if (!room) return;

        const secondsSpentOnThisQuestion = 30 - timeLeft;
        setTimeTaken((prevTime) => prevTime + secondsSpentOnThisQuestion);

        if (currentQuestion < room.questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setTimeLeft(30);
        } else {
            await finishQuiz();
        }
    };

    useEffect(() => {
        if (loading || showResult || !room || isSubmitting) return;

        const timer = setInterval(() => {
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

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setTimeLeft(30);
        }
    };

    const finishQuiz = async () => {
        let correct = 0;
        room.questions.forEach((q, index) => {
            if (userAnswers[index] === q.correctAnswer) {
                correct++;
            }
        });

        const total = room.questions.length;
        const percentage = Math.round((correct / total) * 100);
        const finalTimeTaken = timeTaken + (30 - timeLeft);

        const participant = getParticipant() || {
            name: participantName,
            email: participantEmail,
        };

        const answers = room.questions.map((q, index) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: userAnswers[index] ?? null,
            explanation: q.explanation || null,
        }));

        const roomPayload = {
            userId: participant.email,
            userName: participant.name,
            correct,
            total,
            percentage,
            timeTaken: finalTimeTaken,
            answers,
        };

        try {
            await axios.post(`${API_URL}/api/quizRoom/quiz-attempt`, roomPayload, {
                params: { roomId },
                headers: getAuthHeaders(),
            });

            setScoreData({ correct, total, percentage });
            setAttemptInfo({
                alreadyAttempted: true,
                certificateAllowed: false,
                correct,
                total,
                percentage,
                userName: participant.name,
                roomName: room.roomName,
            });
            setShowResult(true);
        } catch (err) {
            console.error('Error saving quiz updates:', err);
            const msg = err.response?.data?.message || 'Failed to save quiz results.';
            setError(msg);
            if (err.response?.status === 409) {
                setAlreadyAttempted(true);
            }
        }
    };

    const universalBack = () => {
        setRoom(null);
        setTimeLeft(30);
        setShowResult(false);
        setAlreadyAttempted(false);
        setAttemptInfo(null);
        setError('');
    };

    if (showResult && scoreData && room) {
        const participant = getParticipant() || {
            name: participantName,
            email: participantEmail,
        };
        return (
            <Result
                questions={room.questions}
                userAnswers={userAnswers}
                title={room.roomName}
                quizType="General Room Quiz"
                onUniversalBack={universalBack}
                roomCertificate={{
                    roomId,
                    email: participant.email,
                    initiallyAllowed: false,
                }}
            />
        );
    }

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
                isNextDisabled={
                    userAnswers[currentQuestion] === null ||
                    (currentQuestion === room.questions.length - 1 && isSubmitting)
                }
                isBackDisabled={currentQuestion === 0}
                nextText={
                    currentQuestion === room.questions.length - 1
                        ? isSubmitting
                            ? 'Submitting...'
                            : 'Finish'
                        : 'Next'
                }
                title={room.roomName}
                timeLeft={timeLeft}
                onUniversalBack={universalBack}
            />
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center theme-page-bg px-4 pt-24">
            <div className="absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5">
                        Join Quiz Room
                    </h1>
                    <p className="text-gray-300 text-lg">Enter Room ID to Start Quiz</p>
                    {!isLoggedIn && participantName && participantEmail && (
                        <p className="text-gray-400 text-sm mt-3">
                            Playing as <span className="text-cyan-300">{participantName}</span> ({participantEmail})
                        </p>
                    )}
                    {isLoggedIn && (
                        <p className="text-gray-400 text-sm mt-3">
                            Logged in as <span className="text-cyan-300">{loggedInUser.name}</span>
                        </p>
                    )}
                </div>

                <div className="space-y-6">
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                        className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-white placeholder-gray-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                    />

                    {error && (
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
                            {error}
                        </div>
                    )}

                    {alreadyAttempted && attemptInfo && (
                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 space-y-3">
                            <p className="font-semibold">Quiz already completed</p>
                            <p className="text-sm text-amber-100/80">
                                Score: {attemptInfo.correct} / {attemptInfo.total} ({attemptInfo.percentage}%)
                            </p>
                            <AlreadyAttemptedCertificate
                                roomId={roomId}
                                email={(getParticipant()?.email) || participantEmail}
                                roomName={attemptInfo.roomName || 'Room Quiz'}
                                initiallyAllowed={Boolean(attemptInfo.certificateAllowed)}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleJoinRoom}
                        disabled={loading || alreadyAttempted}
                        className="py-5 text-xl duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50 px-17 w-full rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white"
                    >
                        {loading ? 'Joining Room...' : alreadyAttempted ? 'Already Attempted' : 'Start Quiz'}
                    </button>

                    {!isLoggedIn && (
                        <button
                            type="button"
                            onClick={() => {
                                setGuestFormName(participantName);
                                setGuestFormEmail(participantEmail);
                                setGuestFormError('');
                                setShowGuestModal(true);
                                setAlreadyAttempted(false);
                                setAttemptInfo(null);
                                setError('');
                            }}
                            className="w-full text-sm text-gray-400 hover:text-cyan-300 transition-colors"
                        >
                            {participantName ? 'Change name / email' : 'Enter name & email as guest'}
                        </button>
                    )}
                </div>
            </div>

            {showGuestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 md:p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-2">Before you start</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Enter your name and email. These will be saved for future room quizzes and shown on the admin audit.
                        </p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={guestFormName}
                                onChange={(e) => setGuestFormName(e.target.value)}
                                placeholder="Your name"
                                className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white placeholder-gray-400 outline-none focus:border-cyan-400"
                            />
                            <input
                                type="email"
                                value={guestFormEmail}
                                onChange={(e) => setGuestFormEmail(e.target.value)}
                                placeholder="Your email"
                                className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-white placeholder-gray-400 outline-none focus:border-cyan-400"
                            />

                            {guestFormError && (
                                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
                                    {guestFormError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowGuestModal(false)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGuestContinue}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-2xl font-bold bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
                                >
                                    {loading ? 'Joining...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AlreadyAttemptedCertificate = ({ roomId, email, roomName, initiallyAllowed }) => (
    <Result
        questions={[]}
        userAnswers={[]}
        title={roomName}
        quizType="General Room Quiz"
        onUniversalBack={() => {}}
        roomCertificate={{
            roomId,
            email,
            initiallyAllowed,
        }}
        hideReview
    />
);

export default RoomQuiz;
