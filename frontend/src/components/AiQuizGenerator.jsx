import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { ChevronDown, Flag, Home, ShieldCheck } from 'lucide-react';
import Nav from './Nav';
import QuizScreen from './QuizScreen'; // <-- Imported
import { toast } from "react-toastify";
import Result from './Result';
// import '../style/CustomToast.css';
const AiQuizGenerator = () => {

    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [loading, setLoading] = useState(false);
    const [quiz, setQuiz] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [roomTitle, setRoomTitle] = useState("");
    const [creatingRoom, setCreatingRoom] = useState(false);
    const [createdRoom, setCreatedRoom] = useState(null);

    const handleNextClick = async () => {
        // Last question
        if (currentQuestion === quiz.questions.length - 1) {
            setIsSubmitting(true);
            try {
                await handleNext();
            } finally {
                setIsSubmitting(false);
            }
        } else {
            handleNext();
        }
    };

    // Timer
    useEffect(() => {
        if (loading || showRoomModal) return;;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext();
                    return 180;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestion, loading, showRoomModal]);


    // Generate AI Quiz
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

            const res = await axios.post(
                `${API_URL}/api/ai/generate-quiz`,
                formData,
                {
                    timeout: 80000,
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setQuiz(res.data);
            setTimeLeft(60);
            setUserAnswers(new Array(res.data.questions.length).fill(null));
            setCurrentQuestion(0);

        } catch (err) {
            const message =
                err.response?.data?.message
                || (err.code === 'ERR_NETWORK' ? 'Network error or AI generation timeout.' : err.message)
                || 'Failed to generate quiz.';

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const openRoomModal = () => {
        setShowRoomModal(true);
    };
    const closeRoomModal = () => {
        setShowRoomModal(false);
        setRoomTitle("");
        setCreatedRoom(null);
    };
    // Select Answer
    const handleAnswerSelect = (index) => {
        const updated = [...userAnswers];
        updated[currentQuestion] = index;
        setUserAnswers(updated);
    };

    // Next Question
    const handleNext = async () => {
        if (!quiz) return;
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setTimeLeft(60);
        } else {
            await handleSubmitAnswers();
        }
    };

    // Back Question
    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setTimeLeft(60);
        }
    };


    // Submit Answers
    const handleSubmitAnswers = async () => {
        if (!quiz) return;
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(
                `${API_URL}/api/ai/quiz-summary`,
                {
                    questions: quiz.questions,
                    userAnswers
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSummary(res.data);
            setShowSummary(true);

            // Save Attempt
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

                axios.post(
                    `${API_URL}/api/quiz-attempts`,
                    payload,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }
        } catch (err) {
            setError('Failed to generate quiz summary.');
        } finally {
            setLoading(false);
        }
    };

    // Retake Quiz
    const handleRetake = () => {
        setQuiz(null);
        setUserAnswers([]);
        setShowSummary(false);
        setSummary(null);
        setText('');
        setFile(null);
        setCurrentQuestion(0);
    };


    const handleCreateRoom = async () => {

        if (!roomTitle.trim()) {
            toast("Please Enter Room Title !", {
                autoClose: 1200,
                closeButton: true,
                type: error
            });
            return;
        };

        setCreatingRoom(true);

        try {

            const formattedQuestions = quiz.questions.map(
                ({ question, options, answerIndex }) => ({
                    question,
                    options,
                    correctAnswer: answerIndex
                })
            );

            const payload = {
                roomName: roomTitle,
                questions: formattedQuestions
            };

            const res = await axios.post(
                `${API_URL}/api/room`,
                payload,
                {
                    params: { email: storedUser.email },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCreatedRoom(res.data);

        } catch (err) {

            console.log(err);

        } finally {

            setCreatingRoom(false);

        }

    };

    const universalBack = ()=>{
        console.log('back');
        setQuiz(null);
        setUserAnswers([]);
        setShowSummary(false);
        setSummary(null);
        setText('');
        setFile(null);
        setCurrentQuestion(0);
        setTimeLeft(60);
        showSummary(false)
    };

    const handleDashboard = () => navigate('/dashboard');
    const current = quiz && quiz.questions[currentQuestion];

    // File Upload Button Effect
    useEffect(() => {
        const btn = document.querySelector('#inputbtn');
        const input = document.querySelector('#fileinput');
        if (!btn || !input) return;

        const handleBtnClick = () => input.click();
        const handleInputChange = (e) => {
            if (e.target.files && e.target.files[0]) {
                btn.textContent = e.target.files[0].name;
            }
        };

        btn.addEventListener('click', handleBtnClick);
        input.addEventListener('change', handleInputChange);

        return () => {
            btn.removeEventListener('click', handleBtnClick);
            input.removeEventListener('change', handleInputChange);
        };
    }, []);

    // INITIAL SCREEN
    if (!quiz && !showSummary) {
        return (
            <div className='relative min-h-screen overflow-hidden flex items-center justify-center bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 py-10'>
                <div className='absolute -top-30 -left-30 w-87.5 h-87.5 bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute -bottom-30 -right-30 w-87.5 h-87.5 bg-purple-500/20 rounded-full blur-3xl' />
                <Nav />

                <div className='mt-15 relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>
                    <h1 className='text-4xl md:text-5xl font-extrabold text-center mb-10 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'>
                        AI Quiz Generator
                    </h1>

                    <form onSubmit={handleGenerate} className='space-y-8'>
                        <div>
                            <label className='block text-xl font-bold text-white mb-4 tracking-wide'>
                                Paste Study Material
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={7}
                                placeholder='Paste your notes here...'
                                className='w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-white placeholder-gray-400 outline-hidden resize-none transition-all duration-300 focus:border-cyan-400/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                            />
                        </div>

                        <div>
                            <label className='block text-xl font-bold text-white mb-4 tracking-wide'>
                                Upload PDF / TXT File
                            </label>
                            <input
                                id='fileinput'
                                type='file'
                                accept='application/pdf,text/plain'
                                onChange={(e) => setFile(e.target.files[0] || null)}
                                className='hidden'
                            />
                            <button
                                id='inputbtn'
                                type='button'
                                className='w-full py-4 rounded-2xl border border-dashed border-cyan-400/40 bg-white/5 text-gray-300 font-semibold hover:bg-white/10 hover:border-cyan-400/60 hover:text-white hover:scale-[1.01] transition-all duration-300 cursor-pointer'
                            >
                                Upload File
                            </button>
                        </div>

                        {error && (
                            <div className='bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.1)]'>
                                {error}
                            </div>
                        )}

                        <button
                            type='submit'
                            disabled={loading}
                            className='py-5  text-xl  duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50
                        
                        px-17  w-full  rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                        >
                            {loading ? 'Generating...' : 'Generate AI Quiz'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // QUIZ SCREEN
    if (quiz && !showSummary && current) {

        return (
            <>
                <QuizScreen
                    currentQuestion={currentQuestion}
                    totalQuestions={quiz.questions.length}
                    questionData={current}
                    selectedAnswer={userAnswers[currentQuestion]}
                    onSelectAnswer={handleAnswerSelect}
                    onNext={handleNextClick}
                    onBack={handleBack}
                    isNextDisabled={userAnswers[currentQuestion] === null || isSubmitting}
                    isBackDisabled={currentQuestion === 0}
                    nextText={currentQuestion === quiz.questions.length - 1 ? (isSubmitting ? 'Submitting...' : 'Finish') : 'Next'}
                    timeLeft={timeLeft}
                    role={storedUser.role}
                    onGenerateRoom={openRoomModal}
                    onUniversalBack={universalBack}
                />
                {
                    showRoomModal && (
                        <div
                            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                            onClick={closeRoomModal}
                        >

                            <div
                                className="  p-8 w-90 md:w-120   rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >



                                {!createdRoom && (
                                    <>
                                        <h2 className="text-2xl font-bold text-white mb-6">
                                            Create Quiz Room
                                        </h2>

                                        <input
                                            value={roomTitle}
                                            onChange={(e) => setRoomTitle(e.target.value)}
                                            placeholder="Enter Room Title"
                                            className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white"
                                        />
                                        <button
                                            onClick={handleCreateRoom}
                                            disabled={creatingRoom}
                                            className="flex-1  text-lg  hover:border-blue-400/40  duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed
                            
                                        px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white"
                                        >

                                            {creatingRoom
                                                ? "Creating..."
                                                : "Create Room"}

                                        </button>
                                    </>


                                )}

                                {createdRoom && (
                                    <div className="mt-6">

                                        <h3 className="text-green-400 text-xl font-bold">

                                            ✅ Room Created Successfully

                                        </h3>


                                        <div className="mt-4 font-bold text-white">

                                            Room Name

                                        </div>

                                        <div className="bg-white/20 rounded-2xl hover:bg-white/5 p-3  mt-2 text-white text-xl font-semibold">

                                            {createdRoom.roomName || createdRoom._id}

                                        </div>
                                        <div className="mt-4 font-bold text-white">

                                            Room ID

                                        </div>

                                        <div className="bg-white/30 rounded-2xl hover:bg-white/5 p-3  mt-2 text-cyan-400 font-mono">

                                            {createdRoom.id || createdRoom._id}

                                        </div>

                                    </div>

                                )}

                                <button
                                    onClick={closeRoomModal}
                                    className="flex-1  text-lg  hover:border-blue-400/40  duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed
                            
                            px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white"
                                >
                                    Close
                                </button>

                            </div>

                        </div>
                    )
                }
            </>
        );
    }



    // SUMMARY SCREEN
    if (quiz && showSummary && summary) {
        return (
            <Result questions={quiz.questions} userAnswers={userAnswers} title={quiz.questions[0].topic} summary={summary.overallSummary} recommendation={summary.recommendations} onUniversalBack={universalBack}/>
        );
    }

    return null;
};

export default AiQuizGenerator;