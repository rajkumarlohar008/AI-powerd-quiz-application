import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import API_URL from '../config';
import { CirclePlus, FileChartPie, Plus, Trash, Undo2, SquarePen, Eye, X, NotebookPen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizScreen from './QuizScreen';
import Result from './Result';
import { toast } from 'react-toastify';

const PredefinedQuiz = () => {
    let token = localStorage.getItem('token');
    const isAdmin = JSON.parse(localStorage.getItem('user'))?.role === 'admin';
    const [user, setUser] = useState(null);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState([]);
    const [searchedResult, setSearchedResult] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isFinishDisabled, setIsFinishDisabled] = useState(false);
    const navigate = useNavigate();

    // View States
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [addPreset, setAddPreset] = useState(false);
    const [updatingRoom, setUpdatingRoom] = useState(false);
    const [viewOnly, setViewOnly] = useState(false);

    // Form States
    const [presetTitle, setPresetTitle] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    const [tab, setTab] = useState('user');

    const EMPTY_QUESTION = {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
    };

    // FIXED: useCallback prevents an infinite network request loop to your Spring Boot API
    const fetchResults = useCallback(async () => {
        try {
            if (tab === 'user') {
                toast.info("Finding Presets Please wait !!");
                const res = await axios.get(`${API_URL}/api/preset/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResult(res.data.query || []);
                setSearchedResult(res.data.query || []);
            }
        } catch (error) {
            console.error("Error fetching predefined quizzes:", error);
            setResult([]);
            setSearchedResult([]);
        }
    }, [API_URL, token, tab]);

    useEffect(() => {
        fetchResults();
    }, [token])

    useEffect(() => {
        if (query.trim() === "") {
            setSearchedResult(result);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchedResult(result.filter((item) => {
                return item.presetName.toLowerCase().includes(query.toLowerCase());
            }));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, fetchResults, API_URL, token]);
    useEffect(() => {
        if (loading || showResult || addPreset || updatingRoom || viewOnly || !selectedQuiz) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleNext();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestion, loading, showResult, addPreset, updatingRoom, viewOnly, selectedQuiz]);

    const handleSelectPreset = (item) => {
        setSelectedQuiz(item.presetName);
        setQuestions(item.questions);
        setLoading(false);
    };

    const handleAnswerSelect = (index) => {
        setSelectedAnswer(index);
    };

    const handleNext = () => {
        if (currentQuestion === questions.length - 1 && isFinishDisabled) return;

        if (currentQuestion === questions.length - 1) {
            setIsFinishDisabled(true);
        }

        const newAnswers = [...userAnswers];
        newAnswers[currentQuestion] = selectedAnswer;
        setUserAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(newAnswers[currentQuestion + 1] ?? null);
            setTimeLeft(30);
        } else {
            setShowResult(true);
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            setSelectedAnswer(userAnswers[currentQuestion - 1] ?? null);
            setTimeLeft(30);
        }
    };

    // Form Panel Layout Navigation Helpers
    const handleAddPreset = () => {
        resetForm();
        setLoading(false); // FIXED: Clears form button lock state
        setAddPreset(true);
    };

    const handleEditPresetClick = (e, item) => {
        e.stopPropagation(); // Avoid triggering full quiz start
        setSelectedPresetId(item.id);
        setPresetTitle(item.presetName || '');
        setQuestions(item.questions && item.questions.length > 0 ? [...item.questions] : [{ ...EMPTY_QUESTION }]);
        setLoading(false); // FIXED: Clears form button lock state
        setUpdatingRoom(true);
    };

    const handleViewPresetClick = (e, item) => {
        e.stopPropagation();
        setPresetTitle(item.presetName || 'Untitled Quiz');
        setQuestions(item.questions || []);
        setViewOnly(true);
    };

    const handleMenuBack = () => {
        setAddPreset(false);
        setUpdatingRoom(false);
        setViewOnly(false);
        resetForm();
    };

    // Blueprint mutation handlers
    const addQuestion = () => {
        setQuestions([...questions, { ...EMPTY_QUESTION }]);
        toast.info("Question Added!");
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, idx) => idx !== index));
        toast.info("Question removed!");
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const updated = [...questions];
        const updatedOptions = [...updated[qIndex].options];
        updatedOptions[oIndex] = value;
        updated[qIndex] = { ...updated[qIndex], options: updatedOptions };
        setQuestions(updated);
    };

    const validateQuestions = () => {
        if (!presetTitle.trim()) {
            toast.error('Please enter a preset title.');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                toast.info(`Please fill Question ${i + 1}.`);
                return false;
            }

            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j].trim()) {
                    toast.info(`Please fill Option ${j + 1} of Question ${i + 1}.`);
                    return false;
                }
            }
        }
        return true;
    };

    const resetForm = () => {
        setPresetTitle('');
        setQuestions([{ ...EMPTY_QUESTION }]);
        setSelectedPresetId(null);
    };

    // FIXED: API endpoints fully aligned with backend controller signatures
    const handleCreatePreset = async () => {
        if (!validateQuestions()) return;
        setLoading(true);
        try {
            const payload = { presetName: presetTitle, questions };
            await axios.post(`${API_URL}/api/preset/create`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Preset created successfully!');
            handleMenuBack();
            await fetchAdminPresets();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create preset');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePreset = async () => {
        if (!validateQuestions()) return;
        setLoading(true);
        try {
            const payload = { id: selectedPresetId, presetName: presetTitle, questions };
            await axios.put(`${API_URL}/api/preset/update`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Preset updated successfully!');
            handleMenuBack();
            await fetchAdminPresets();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update preset');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePreset = async (e, id) => {
        e.stopPropagation(); // Avoid executing selected room action pointers
        if (!window.confirm("Are you sure you want to delete this preset?")) return;
        try {
            await axios.delete(`${API_URL}/api/preset/delete`, {
                params: { id: id },
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Preset deleted successfully!");
            // Dynamic collection pruning to prevent index out of bounds render crashes
            setResult(prev => prev.filter(item => item.id !== id));
            setSearchedResult(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete preset");
        }
    };

    const fetchAdminPresets = async () => {
        const res = await axios.get(`${API_URL}/api/preset/mine`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const presets = res.data.presets || [];

        setResult(presets);
        setSearchedResult(presets);
        setTab("admin");

        if (presets.length === 0) {
            toast.info(res.data.message || "No presets found");
        }
    }

    const handleAdminTab = () => {
        try {
            if (tab === "user") {
                setQuery('');
                toast.info("Hey Admin,Finding your presets please wait !!")
                fetchAdminPresets();
            } else {
                setTab("user");
                setQuery('');
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch presets");
        }
    };

    const universalBack = () => {
        console.log('back')
        setSelectedQuiz(false);
        setQuestions([]);
        setSelectedAnswer(null);
        setTimeLeft(30);
        setShowResult(false);
    };

    // FIXED: Added safe arrays check to prevent premature renders or index out of bound execution checks
    if (questions.length > 0 && userAnswers.length === questions.length && showResult) {
        return <Result questions={questions} userAnswers={userAnswers} title={selectedQuiz} onUniversalBack={universalBack} />;
    }

    // FIXED SAFE-GUARD: Dynamically tracks if the index point exists, otherwise falls back gracefully to empty schema
    const question = questions && questions.length > 0 ? questions[currentQuestion] : EMPTY_QUESTION;

    return (
        <>

            {/* FIXED SAFE-GUARD: Ensured rendering conditions check that questions are loaded before passing downstream */}
            {selectedQuiz && questions.length > 0 && !addPreset && !updatingRoom && !viewOnly && (
                <QuizScreen
                    currentQuestion={currentQuestion}
                    totalQuestions={questions.length}
                    questionData={question}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={handleAnswerSelect}
                    onNext={handleNext}
                    onBack={handleBack}
                    isNextDisabled={selectedAnswer === null || (currentQuestion === questions.length - 1 && isFinishDisabled)}
                    isBackDisabled={currentQuestion === 0}
                    nextText={currentQuestion === questions.length - 1 ? (isFinishDisabled ? 'Submitting...' : 'Finish') : 'Next'}
                    timeLeft={timeLeft}
                    title={selectedQuiz || 'Predefined Quiz'}
                    onUniversalBack={universalBack}
                />
            )}

            {!selectedQuiz && !addPreset && !updatingRoom && !viewOnly && (
                <div className='relative min-h-screen w-full bg-linear-to-br from-black via-slate-900 to-purple-950 flex justify-center items-start p-4 sm:p-6 md:p-10 pt-24 md:pt-28 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
                    <div className='pointer-events-none absolute -top-30 -left-30 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl' />
                    <div className='pointer-events-none absolute -bottom-30 -right-30 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl' />

                    <div className='mt-10 relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-5 md:p-10 text-white flex flex-col items-center'>
                        <h2 className='text-4xl md:text-5xl font-extrabold text-center mb-10 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'>
                            Search for Quizzes
                        </h2>

                        <input
                            type="text"
                            name="query"
                            value={query}
                            className={`items-center cursor-pointer p-4 md:px-10 rounded-xl border flex gap-5 mb-5 w-full outline-none focus:border-cyan-500/50 `}
                            placeholder={ "Search quizzes..."}
                            onChange={(e) => {
                                setQuery(e.target.value);
                            }}
                        />

                        <div className="flex flex-col gap-4 w-full">
                            <div className='flex justify-between items-center'>
                                <h3 className="text-xl font-bold">{tab === 'user' ? " Predefined Presets" : "Your Presets"}</h3>
                                {isAdmin && (
                                    <div className='flex items-center gap-3'>
                                        {tab === 'admin' && (
                                            <CirclePlus
                                                className='w-7 h-7 text-gray-400 hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                                                onClick={handleAddPreset}
                                            />
                                        )}
                                        <NotebookPen
                                            onClick={handleAdminTab}
                                            className='w-6 h-6 text-gray-400 hover:text-amber-400 cursor-pointer transition-transform hover:scale-110 active:scale-95'
                                        />
                                    </div>
                                )}
                            </div>

                            {searchedResult && searchedResult.length > 0 ? (
                                searchedResult.map((item, index) => (
                                    <div key={index}
                                        onClick={() => handleSelectPreset(item)}
                                        className={`items-center cursor-pointer p-4 md:px-10 bg-white/5 rounded-xl border border-white/10 flex justify-between gap-5 transition-all hover:bg-white/10 ${tab === 'admin' ? 'flex-col items-start sm:flex-row' : ''} `}>
                                        <div className='flex items-center gap-5'>
                                            <FileChartPie className='w-6 h-6 text-cyan-400' />
                                            <h4 className='font-semibold text-xl'>{item.presetName || "Untitled Quiz"}</h4>
                                        </div>
                                        <div className='flex items-center gap-4 self-end justify-end'>
                                            {isAdmin && tab === 'admin' && (
                                                <>
                                                    <Eye onClick={(e) => handleViewPresetClick(e, item)} className="w-5 h-5 text-gray-400 hover:text-cyan-400 cursor-pointer transition-transform hover:scale-110" />
                                                    <SquarePen onClick={(e) => handleEditPresetClick(e, item)} className="w-5 h-5 text-gray-400 hover:text-amber-400 cursor-pointer transition-transform hover:scale-110" />
                                                    <Trash onClick={(e) => handleDeletePreset(e, item.id)} className="w-5 h-5 text-gray-400 hover:text-red-400 cursor-pointer transition-transform hover:scale-110" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-center italic py-4">Result is not available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(addPreset || updatingRoom) && (
                <div className='relative min-h-screen w-full bg-linear-to-br from-black via-slate-900 to-purple-950 flex justify-center items-start p-4 sm:p-6 md:p-10 pt-24 md:pt-28 overflow-y-auto text-white'>
                    <div className='w-full max-w-4xl space-y-6 mt-10 relative z-10'>
                        <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:px-15 space-y-4'>
                            <div className='w-full flex justify-between items-center'>
                                <h2 className='md:text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>
                                    {updatingRoom ? 'Update Preset Configuration' : 'Preset Configuration'}
                                </h2>
                                <Undo2
                                    onClick={handleMenuBack}
                                    className='h-6 hover:text-blue-400 transition-all duration-150 md:h-10 cursor-pointer hover:scale-125 active:scale-95'
                                    size={32}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 md:text-[13px]'>Quiz Preset Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Javascript Advanced Core Patterns"
                                    value={presetTitle}
                                    onChange={(e) => setPresetTitle(e.target.value)}
                                    className='w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 text-white outline-none transition-all md:text-lg'
                                />
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <div className='flex items-center justify-between md:px-15'>
                                <h2 className='text-xl font-bold text-purple-400'>Quiz Questions ({questions.length})</h2>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className='px-4 py-2 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl transition-all flex items-center hover:scale-110 active:scale-95'
                                >
                                    <Plus size={25} />Add Question
                                </button>
                            </div>

                            {questions.map((q, qIdx) => (
                                <div key={qIdx} className='rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4 relative overflow-hidden md:px-15'>
                                    <div className='flex items-center justify-between border-b border-white/5 pb-2'>
                                        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm md:text-xl md:p-4'>
                                            {qIdx + 1}
                                        </span>
                                        {questions.length > 1 && (
                                            <Trash
                                                type="button"
                                                onClick={() => removeQuestion(qIdx)}
                                                className='text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer hover:scale-125 active:scale-95'
                                                size={25}
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className='md:text-lg block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>Question Statement</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter the quiz question text..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                                            className='w-full px-4 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-purple-500 text-sm transition-all py-4 md:py-3 md:text-lg'
                                        />
                                    </div>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className='space-y-1'>
                                                <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider block md:text-[13px]'>Option {oIdx + 1}</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder={`Option value ${oIdx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                    className='w-full px-3 py-3 md:text-[14px] rounded-xl bg-black/20 border border-white/5 text-white text-sm outline-none focus:border-white/20 transition-all'
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className='pt-2'>
                                        <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>Target Correct Answer Index</label>
                                        <select
                                            value={q.correctAnswer}
                                            onChange={(e) => updateQuestion(qIdx, 'correctAnswer', parseInt(e.target.value, 10))}
                                            className='px-8 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-emerald-400 outline-none cursor-pointer focus:border-emerald-500/40 transition-all md:w-1/3 py-3 md:px-4'
                                        >
                                            <option value={0} className="bg-slate-900 text-white">Option 1 is Correct</option>
                                            <option value={1} className="bg-slate-900 text-white">Option 2 is Correct</option>
                                            <option value={2} className="bg-slate-900 text-white">Option 3 is Correct</option>
                                            <option value={3} className="bg-slate-900 text-white">Option 4 is Correct</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='pt-4'>
                            <button
                                onClick={updatingRoom ? handleUpdatePreset : handleCreatePreset}
                                disabled={loading}
                                className='py-5 text-xl duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50 px-17 w-full rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                            >
                                {loading ? (updatingRoom ? 'Updating...' : 'Creating...') : (updatingRoom ? 'Update Quiz Preset' : 'Create Quiz Preset')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewOnly && (
                <div className='relative min-h-screen w-full bg-linear-to-br from-black via-slate-900 to-purple-950 flex justify-center items-start p-4 sm:p-6 md:p-10 pt-24 md:pt-28 overflow-y-auto text-white'>
                    <div className='w-full max-w-4xl space-y-6 mt-10 relative z-10'>
                        <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:px-15 space-y-4'>
                            <div className='w-full flex justify-between items-center'>
                                <h2 className='md:text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>{`Preview preset (${questions.length})`}</h2>
                                <X onClick={handleMenuBack} className='h-6 hover:text-red-400 cursor-pointer transition-all hover:scale-125' size={28} />
                            </div>
                            <div className='text-2xl font-extrabold text-white tracking-wide'>{presetTitle}</div>
                        </div>

                        <div className='space-y-4'>
                            {questions.map((q, qIdx) => (
                                <div key={qIdx} className='rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4 relative overflow-hidden md:px-15'>
                                    <span className='flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm md:text-xl md:p-4 mb-2'>
                                        {qIdx + 1}
                                    </span>
                                    <div className='text-lg font-medium text-gray-200 mb-4'>{q.question}</div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                        {q.options.map((opt, oIdx) => {
                                            const isCorrect = q.correctAnswer === oIdx;
                                            return (
                                                <div key={oIdx} className={`p-4 rounded-xl border text-sm min-h-[46px] flex items-center ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-black/20 border-white/5 text-gray-400'}`}>
                                                    Option {oIdx + 1}: {opt} {isCorrect && " ✓"}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type='button' onClick={handleMenuBack} className='w-full py-4 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-white'>
                            Back to Quizzes
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PredefinedQuiz;