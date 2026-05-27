import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { ChevronDown, Home, ShieldCheck } from 'lucide-react';
import Nav from './Nav';
import QuizScreen from './QuizScreen'; // <-- Imported

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
        } else {
            await handleSubmitAnswers();
        }
    };

    // Back Question
    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
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
            />
        );
    }

    // SUMMARY SCREEN
    if (quiz && showSummary && summary) {
        const total = quiz.questions.length;
        const correct = quiz.questions.reduce((acc, q, idx) => (userAnswers[idx] === q.answerIndex) ? acc + 1 : acc, 0);
        const incorrect = total - correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return (
            <div className='relative min-h-screen overflow-hidden bg-linear-to-br from-black via-slate-900 to-purple-950 flex items-center justify-center px-4 py-10'>
                <div className='absolute -top-30 -left-30 w-87.5 h-87.5 bg-cyan-500/20 rounded-full blur-3xl' />
                <div className='absolute -bottom-30 -right-30 w-87.5 h-87.5 bg-purple-500/20 rounded-full blur-3xl' />
                <Nav />

                <div className='mt-15 relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>
                    <div className='text-center mb-10'>
                        <h1 className='text-4xl md:text-5xl font-extrabold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5 tracking-wide drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]'>
                            AI Quiz Summary 🎓
                        </h1>
                    </div>

                    <div className='flex justify-center mb-12'>
                        <div className='w-44 h-44 rounded-full bg-linear-to-r from-cyan-500 to-purple-600 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]'>
                            <h2 className='text-5xl font-extrabold text-white'>{percentage}%</h2>
                            <p className='text-white mt-2 font-semibold tracking-wide'>Your Score</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-10'>
                        <div className='rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center shadow-[0_0_15px_rgba(16,185,129,0.05)]'>
                            <h3 className='text-4xl font-bold text-emerald-400'>{correct}</h3>
                            <p className='text-gray-300 font-medium mt-1'>Correct</p>
                        </div>
                        <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center shadow-[0_0_15px_rgba(239,68,68,0.05)]'>
                            <h3 className='text-4xl font-bold text-red-400'>{incorrect}</h3>
                            <p className='text-gray-300 font-medium mt-1'>Incorrect</p>
                        </div>
                        <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-6 text-center shadow-[0_0_15px_rgba(6,182,212,0.05)]'>
                            <h3 className='text-4xl font-bold text-cyan-400'>{total}</h3>
                            <p className='text-gray-300 font-medium mt-1'>Total</p>
                        </div>
                    </div>

                    {summary.overallSummary && (
                        <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-8'>
                            <h2 className='text-2xl font-bold text-white mb-4 tracking-wide'>Overall Feedback</h2>
                            <p className='text-gray-300 leading-relaxed'>{summary.overallSummary}</p>
                        </div>
                    )}

                    {summary.topics && (
                        <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-8'>
                            <h2 className='text-2xl font-bold text-white mb-4 tracking-wide'>Topic Strengths</h2>
                            <div className='space-y-3'>
                                {summary.topics.map((t, idx) => (
                                    <div key={idx} className='flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0'>
                                        <span className='text-white font-semibold text-lg'>{t.topic}</span>
                                        <span className='text-gray-300 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm mt-2 md:mt-0 font-medium'>
                                            {t.strength} &nbsp;•&nbsp; <span className='text-cyan-400 font-bold'>{t.correct}/{t.total}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {summary.recommendations && (
                        <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-10'>
                            <h2 className='text-2xl font-bold text-white mb-4 tracking-wide'>Recommendations</h2>
                            <ul className='list-disc list-inside text-gray-300 space-y-3'>
                                {summary.recommendations.map((r, idx) => (
                                    <li key={idx} className='leading-relaxed'>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className='rounded-2xl bg-white/5 border border-white/10 p-6 mb-10'>
                        <h2 className='text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3 tracking-wide'>Answers & Explanations Review</h2>
                        <div className='space-y-6'>
                            {quiz.questions.map((q, idx) => {
                                const userIdx = userAnswers[idx];
                                const correctIdx = q.answerIndex;
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
                                            <p className='text-gray-300'>
                                                <strong className='text-white font-semibold'>Correct Answer: </strong>
                                                <span className='text-emerald-400 font-medium'>{correctAnswerText}</span>
                                            </p>
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
                        </div>
                    </div>

                    <div className='flex flex-col md:flex-row gap-5'>
                        <button onClick={handleRetake} className='flex-1 px-17  w-full py-4 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'>
                            Retake AI Quiz
                        </button>
                        <button onClick={handleDashboard} className='flex-1 px-17  w-full py-4 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'>
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