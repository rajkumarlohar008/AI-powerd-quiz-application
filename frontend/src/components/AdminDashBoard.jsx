import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { Link } from 'react-router-dom';
import { ChevronDown, CirclePlus, Eye, Home, Plus, ShieldCheck, SquarePen, Trash, Undo2, X } from 'lucide-react';
import Nav from './Nav';
import { toast } from 'react-toastify';

// Reusable blueprint structure for empty questions
const EMPTY_QUESTION = {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
};

const AdminDashBoard = () => {
    const [roomTitle, setRoomTitle] = useState('');
    const [rooms, setRooms] = useState([]);
    const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION }]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [createdRoom, setCreatedRoom] = useState(null);

    // --- MODAL & RESPONSES STATES ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomResponses, setRoomResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingRoomId, setDeletingRoomId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [updatingRoom, setUpdatingRoom] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [preview, setPreview] = useState(false);

    // Safely parse credentials using useMemo to avoid parsing on every single render
    const { user, token, userEmail } = useMemo(() => {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        const storedToken = localStorage.getItem('token') || '';
        return { user: storedUser, token: storedToken, userEmail: storedUser.email };
    }, []);

    // Helper to safely extract Room ID
    const getRoomId = (room) => room?.id || room?._id;

    // --- REUSABLE DISPATCHERS / API HELPERS ---
    const fetchRooms = useCallback(async () => {
        if (!userEmail) return;
        try {
            const res = await axios.get(`${API_URL}/api/room/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(res.data || []);
        } catch (err) {
            console.error("Failed to load existing rooms:", err);
        }
    }, [userEmail, token]);

    const fetchResponses = useCallback(async (roomId) => {
        if (!roomId) return;
        setLoadingResponses(true);
        try {
            const res = await axios.get(`${API_URL}/api/room/${roomId}/responses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoomResponses(res.data || []);
        } catch (err) {
            console.error("Error fetching room responses:", err);
            toast.error(err.response?.data?.message || "Error fetching room responses.");
            setRoomResponses([]);
        } finally {
            setLoadingResponses(false);
        }
    }, [token]);

    // Fetch initial rooms on mount
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // --- FORM MANAGEMENT ---
    const resetForm = () => {
        setRoomTitle('');
        setQuestions([{ ...EMPTY_QUESTION }]);
        // setCreatedRoom(null);
        setMessage('');
    };

    const handleBack = () => {
        resetForm();
        setShowForm(false);
        setUpdatingRoom(false);
        setEditingRoomId(null);
        setPreview(false);
    };

    const handleClose = () => {
        setCreatedRoom(null);
        setMessage('');
    };

    // --- VALIDATION HELPER ---
    const validateQuestions = () => {
        if (!roomTitle.trim()) {
            toast.error('Please enter a room title.');
            return false;
        }

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.question.trim()) {
                const errMsg = `Please fill Question ${i + 1}.`;
                setMessage(errMsg);
                toast.info(errMsg);
                return false;
            }

            for (let j = 0; j < question.options.length; j++) {
                if (!question.options[j].trim()) {
                    const errMsg = `Please fill Option ${j + 1} of Question ${i + 1}.`;
                    setMessage(errMsg);
                    toast.info(errMsg);
                    return false;
                }
            }
        }
        return true;
    };

    // --- ACTIONS ---
    const handleRoomCreation = () => {
        resetForm();
        setShowForm(true);
    };

    const openUpdateRoom = (e, room) => {
        e.stopPropagation(); // Fixes propagation bubbling to handleSelectRoom
        const roomId = getRoomId(room);
        setEditingRoomId(roomId);
        setUpdatingRoom(true);
        setRoomTitle(room.roomName || room.title || '');
        setQuestions(room.questions ? JSON.parse(JSON.stringify(room.questions)) : [{ ...EMPTY_QUESTION }]);
    };
    const openPreview = (e, room) => {
        e.stopPropagation(); // Fixes propagation bubbling to handleSelectRoom
        const roomId = getRoomId(room);
        setEditingRoomId(roomId);
        setPreview(true);
        setRoomTitle(room.roomName || room.title || '');
        setQuestions(room.questions ? JSON.parse(JSON.stringify(room.questions)) : [{ ...EMPTY_QUESTION }]);
    };

    const handleSelectRoom = async (room) => {
        const roomId = getRoomId(room);
        if (!roomId) return;
        setSelectedRoom(room);
        setIsModalOpen(true);
        await fetchResponses(roomId);
    };

    const handleDeleteResponse = async (originalIdx) => {
        const roomId = getRoomId(selectedRoom);
        try {
            await axios.delete(`${API_URL}/api/room/response/delete`, {
                params: { index: originalIdx, id: roomId },
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Response Deleted Successfully !!");
            await fetchResponses(roomId);
        } catch (err) {
            console.error('Failed to delete response:', err);
            toast.error(err.response?.data?.message || "Failed to delete response.");
        }
    };

    const handleDeleteClick = async (e, originalIdx) => {
        e.stopPropagation();
        setDeletingId(originalIdx);
        toast.info("Deleting Response !");
        try {
            await handleDeleteResponse(originalIdx);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDelete = async (roomId) => {
        if (!roomId) return;
        try {
            toast.info("Deleting room !!");
            await axios.delete(`${API_URL}/api/room/delete`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (selectedRoom && getRoomId(selectedRoom) === roomId) {
                setIsModalOpen(false);
                setSelectedRoom(null);
            }

            toast.success("Room Deleted successfully!");
            await fetchRooms();
        } catch (err) {
            console.error("Failed to delete room:", err);
            toast.error(err.response?.data?.message || "Failed to delete room");
        }
    };

    const handleRoomDeleteClick = async (e, roomId) => {
        e.stopPropagation();
        setDeletingRoomId(roomId);
        try {
            await handleDelete(roomId);
        } finally {
            setDeletingRoomId(null);
        }
    };

    // --- QUESTION COMPILER MUTATORS ---
    const addQuestion = () => {
        setQuestions([...questions, { ...EMPTY_QUESTION }]);
        toast.info("Question Added !");
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, idx) => idx !== index));
        toast.info("Question removed !");
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

    // --- CREATION & UPDATE SUBMISSIONS ---
    const handleCreateRoom = async () => {
        if (!validateQuestions()) return;

        setLoading(true);
        setMessage('');

        try {
            const payload = { roomName: roomTitle, questions };
            const res = await axios.post(`${API_URL}/api/room`, payload, {
                params: { email: userEmail },
                headers: { Authorization: `Bearer ${token}` }
            });

            setCreatedRoom(res.data);
            toast.success('Quiz room created successfully!');
            resetForm();
            await fetchRooms();
        } catch (err) {
            console.error("Failed to create room:", err);
            const errMsg = err.response?.data?.message || 'Failed to create room';
            setMessage(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const saveUpdatedRoom = async () => {
        if (!validateQuestions()) return;

        setLoading(true);
        setMessage('');

        try {
            const payload = { id: editingRoomId, roomName: roomTitle, questions };
            const res = await axios.put(`${API_URL}/api/room/update`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCreatedRoom(res.data);
            toast.success("Quiz room updated successfully!");

            setUpdatingRoom(false);
            setEditingRoomId(null);
            setRoomTitle('');
            setQuestions([{ ...EMPTY_QUESTION }]);

            await fetchRooms();
        } catch (err) {
            console.error("Failed to update room:", err);
            toast.error(err.response?.data?.message || 'Failed to update room');
        } finally {
            setLoading(false);
        }
    };

    // Memoize the sorted leaderboard data along with the original absolute array positions
    const sortedResponsesWithIndices = useMemo(() => {
        return roomResponses
            .map((item, originalIdx) => ({ ...item, originalIdx }))
            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    }, [roomResponses]);




    return (
        <div className='relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-black via-slate-900 to-purple-950 px-4 py-10 text-white'>
            {/* Glow Background Rings */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none' />

            <Nav />
            {/* Main Wrapper Panel Container */}
            <div className='mt-12 relative z-10 max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-10'>

                {/* Header Title Block */}
                <div className='text-center mb-10'>
                    <h1 className='text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5'>
                        Admin Dashboard
                    </h1>
                    <p className='text-gray-300 text-lg'>
                        Create Quiz Rooms & Click Active Registries to Audit Submissions
                    </p>
                </div>

                {/* 2-Column Responsive Split Layout */}
                {!showForm && !updatingRoom && !preview && (
                    <div className='flex-initial gap-8 items-start'>
                        <div className='space-y-6 w-full'>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl min-h-[60vh]'>
                                <div className='w-full flex justify-between items-center md:px-10'>
                                    <h3 className='text-lg md:text-2xl font-bold text-white border-b border-white/5 pb-2'>Active Room Registries</h3>
                                    <CirclePlus
                                        onClick={handleRoomCreation}
                                        className='w-7 h-7 hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                                        size={32}
                                    />
                                </div>
                                <p className='text-xs md:text-xl text-gray-400 italic -mt-2 mb-1'>📊 Click a room card to view user scores.</p>

                                {rooms && rooms.length > 0 ? (
                                    <div className='space-y-3 max-h-125 md:p-5 md:flex md:flex-col items-center overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 overflow-x-hidden'>
                                        {rooms.map((room, idx) => {
                                            const roomId = getRoomId(room);
                                            return (
                                                <div
                                                    key={roomId || idx}
                                                    onClick={() => handleSelectRoom(room)}
                                                    className='p-4 md:p-8 rounded-xl md:w-[98%] cursor-pointer bg-black/30 border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 hover:scale-[1.02] transition-all duration-200 flex flex-col gap-1'
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <h4 className='font-bold text-sm text-gray-300 group-hover:text-cyan-300 truncate mr-2 md:text-2xl'>
                                                            {room.roomName || room.title || 'Untitled Room'}
                                                        </h4>
                                                        <span className='shrink-0 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-300 font-sans font-semibold text-xs md:text-md lg:text-lg'>
                                                            {room.questions?.length || 0} Qs
                                                        </span>
                                                    </div>
                                                    <div className='flex flex-col md:flex-row md:justify-between md:items-center'>
                                                        <div className='flex flex-col  items-start justify-between text-[11px] text-gray-400 font-mono mt-2.5'>
                                                            <span className='truncate text-gray-500 font-semibold md:text-[15px]'>Room ID:{roomId}</span>
                                                            <span className='text-[8px] md:text-xs'>You can copy this id and share with the participants.</span>
                                                        </div>
                                                        <div className='flex items-center  justify-between w-1/3 gap-3 w-28'>
                                                            <Eye size={28}
                                                                onClick={(e) => { openPreview(e, room) }}
                                                                className='w-6  text-gray-400 hover:text-cyan-400 cursor-pointer transition-transform hover:scale-110'
                                                            />
                                                            <SquarePen
                                                                onClick={(e) => openUpdateRoom(e, room)}
                                                                className='w-5 h-5 text-gray-400 hover:text-amber-400 cursor-pointer transition-transform hover:scale-110'
                                                            />
                                                            <Trash
                                                                type="button"
                                                                className='w-5 h-5 text-gray-400 hover:text-red-400 cursor-pointer transition-transform hover:scale-110'
                                                                onClick={(e) => handleRoomDeleteClick(e, roomId)}
                                                                disabled={deletingRoomId === roomId}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className='text-gray-500 text-xs italic text-center py-4'>No live channels deployed.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showForm && !updatingRoom && (
                    <div className='flex-initial gap-8 items-start'>
                        <div className='w-full space-y-6'>
                            {/* Box Panel 1: Room Config Setup */}
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:px-15 space-y-4'>
                                <div className='w-full flex justify-between items-center'>
                                    <h2 className='md:text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>Room Configuration</h2>
                                    <Undo2
                                        onClick={handleBack}
                                        className='w-7 h-7 hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                                        size={32}
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 md:text-[13px]'>Quiz Room Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Javascript Advanced Core Patterns"
                                        value={roomTitle}
                                        onChange={(e) => setRoomTitle(e.target.value)}
                                        className='w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 text-white outline-none transition-all md:text-lg'
                                    />
                                </div>
                            </div>

                            {/* Box Panel 2: Interactive Dynamic Questions Compiler Setup */}
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between md:px-15'>
                                    <h2 className='text-xl font-bold text-purple-400'>Quiz Blueprint Questions ({questions.length})</h2>
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

                                        {/* Question Title Input */}
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

                                        {/* Grid Options Input Area */}
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

                                        {/* Choice Index Evaluator Selector */}
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

                            {createdRoom && (
                                <div className='rounded-3xl border border-purple-500/20 bg-purple-500/10 p-6 space-y-4'>
                                    <div className='flex justify-between items-center'>
                                        <h2 className='text-sm md:text-xl font-bold text-white'>Room Created Successfully 🎉</h2>
                                        <X size={28}
                                            onClick={handleClose}
                                            className='text-red-500 cursor-pointer h-5 md:h-10' />
                                    </div>
                                    <div className='space-y-3 text-gray-300 text-base'>
                                        <div>
                                            <span className='text-xs md:text-lg text-cyan-400 font-bold block mb-1'>Room ID:</span>
                                            <span className='font-mono block bg-black/30 p-3 rounded-xl border border-white/10 text-sm break-all select-all'>{getRoomId(createdRoom)}</span>
                                        </div>
                                        <div className='text-xs md:text-lg'>
                                            <span className='text-cyan-400 font-bold'>Title:</span>{' '}{createdRoom.roomName || createdRoom.title}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dashboard Action Submission Triggers */}
                            <div className='pt-4'>
                                <button
                                    onClick={handleCreateRoom}
                                    disabled={loading}
                                    className='py-5 text-xl duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50 px-17 w-full rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                                >
                                    {loading ? 'Creating Room...' : 'Create Quiz Room'}
                                </button>
                            </div>

                            {message && (
                                <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-cyan-300 text-center font-semibold text-base'>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {updatingRoom && (
                    <div className='flex-initial gap-8 items-start'>
                        <div className='w-full space-y-6'>
                            {/* Box Panel 1: Room Config Setup */}
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:px-15 space-y-4'>
                                <div className='w-full flex justify-between items-center'>
                                    <h2 className='md:text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>Room Configuration</h2>
                                    <Undo2
                                        onClick={handleBack}
                                        className='w-7 h-7 hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                                        size={32}
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 md:text-[13px]'>Quiz Room Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Javascript Advanced Core Patterns"
                                        value={roomTitle}
                                        onChange={(e) => setRoomTitle(e.target.value)}
                                        className='w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 text-white outline-none transition-all md:text-lg'
                                    />
                                </div>
                            </div>

                            {/* Box Panel 2: Interactive Dynamic Questions Compiler Setup */}
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between md:px-15'>
                                    <h2 className='text-xl font-bold text-purple-400'>Quiz Blueprint Questions ({questions.length})</h2>
                                    <button
                                        type="button"
                                        onClick={addQuestion}
                                        className='px-4 py-2 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl transition-all flex items-center hover:scale-125 active:scale-95'
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

                                        {/* Question Title Input */}
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

                                        {/* Grid Options Input Area */}
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

                                        {/* Choice Index Evaluator Selector */}
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

                            {/* Dashboard Action Submission Triggers */}
                            <div className='pt-4'>
                                <button
                                    onClick={saveUpdatedRoom}
                                    disabled={loading}
                                    className='py-5 text-xl duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-50 px-17 w-full rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                                >
                                    {loading ? 'Updating Room...' : 'Update Quiz Room'}
                                </button>
                            </div>

                            {message && (
                                <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-cyan-300 text-center font-semibold text-base'>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {preview && (
                    <div className='flex-initial gap-8 items-start'>
                        <div className='w-full space-y-6'>
                            {/* Box Panel 1: Room Config Setup */}
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:px-15 space-y-4'>
                                <div className='w-full flex justify-between items-center'>
                                    <h2 className='md:text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>Room Configuration</h2>
                                    <Undo2
                                        onClick={handleBack}
                                        className='w-7 h-7 hover:text-blue-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer'
                                        size={32}
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 md:text-[13px]'>Quiz Room Title</label>
                                    {/* Input turned into a static preview block */}
                                    <div className='w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 text-white min-h-[60px] flex items-center md:text-lg'>
                                        {roomTitle || <span className="text-gray-500 italic">Untitled Room</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Box Panel 2: Interactive Dynamic Questions Compiler Setup */}
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between md:px-15'>
                                    <h2 className='text-xl font-bold text-purple-400'>Quiz Blueprint Questions ({questions.length})</h2>
                                    {/* Add Question Button removed from preview layout */}
                                </div>

                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className='rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4 relative overflow-hidden md:px-15'>
                                        <div className='flex items-center justify-between border-b border-white/5 pb-2'>
                                            <span className='flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm md:text-xl md:p-4'>
                                                {qIdx + 1}
                                            </span>
                                            {/* Trash action button removed from preview layout */}
                                        </div>

                                        {/* Question Title Input */}
                                        <div>
                                            <label className='md:text-lg block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>Question Statement</label>
                                            {/* Input statement turned into static block */}
                                            <div className='w-full px-4 rounded-xl bg-black/30 border border-white/10 text-white text-sm py-4 md:py-3 md:text-lg min-h-[52px] flex items-center'>
                                                {q.question || <span className="text-gray-500 italic">No question statement provided...</span>}
                                            </div>
                                        </div>

                                        {/* Grid Options Input Area */}
                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                            {q.options.map((opt, oIdx) => {
                                                const isCorrect = q.correctAnswer === oIdx;
                                                return (
                                                    <div key={oIdx} className='space-y-1'>
                                                        <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider block md:text-[13px]'>
                                                            Option {oIdx + 1} {isCorrect && <span className="text-emerald-400 font-sans font-normal lowercase">(correct answer)</span>}
                                                        </label>
                                                        {/* Option inputs turned static; highlighted slightly if it matches the correct index */}
                                                        <div className={`w-full px-3 py-3 md:text-[14px] rounded-xl border text-sm min-h-[46px] flex items-center ${isCorrect
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                                                            : 'bg-black/20 border-white/5 text-white'
                                                            }`}>
                                                            {opt || <span className="text-gray-600 italic">Empty option value</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Form actions and submission buttons removed from layout to seal read-only layout */}

                            {message && (
                                <div className='rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-cyan-300 text-center font-semibold text-base'>
                                    {message}
                                </div>
                            )}
                            <button
                                type='button'
                                onClick={handleBack}
                                className='w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL OVERLAY POP-UP PORTAL */}
            {!updatingRoom && isModalOpen && selectedRoom && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all'>
                    <div className='relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 text-white shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] flex flex-col overflow-hidden'>

                        <div className='flex items-start justify-between border-b border-white/10 pb-4 shrink-0'>
                            <div>
                                <span className='text-[10px] uppercase tracking-wider font-extrabold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md'>
                                    Live Performance Records
                                </span>
                                <h3 className='text-2xl font-black text-white mt-1 truncate max-w-[450px]'>
                                    {selectedRoom.roomName || selectedRoom.title}
                                </h3>
                                <p className='text-xs text-gray-400 font-mono mt-0.5'>Room ID: {getRoomId(selectedRoom)}</p>
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedRoom(null); }}
                                className='h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-lg'
                            >
                                ✕
                            </button>
                        </div>

                        <div className='flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-[200px] flex flex-col'>
                            {loadingResponses ? (
                                <div className='flex-1 flex flex-col items-center justify-center space-y-3 py-12'>
                                    <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                                    <p className='text-xs text-gray-400 font-mono tracking-wider'>Querying submission indices...</p>
                                </div>
                            ) : sortedResponsesWithIndices && sortedResponsesWithIndices.length > 0 ? (
                                <div className='space-y-3'>
                                    <div className='text-xs text-emerald-400 font-bold tracking-wide flex items-center gap-1.5 mb-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 overflow-x-hidden'>
                                        <span>🏆</span> Leaderboard:
                                    </div>

                                    {sortedResponsesWithIndices.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className='flex-col p-4 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between gap-4 shadow-sm hover:bg-black/60 transition-colors'
                                        >
                                            <div className='flex items-center justify-between w-full'>
                                                <div className='flex flex-col'>
                                                    <div className='flex items-center gap-3 truncate'>
                                                        <span className={`h-7 w-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                                                            idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                                                                idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' :
                                                                    'bg-white/5 text-gray-400 border border-white/5'
                                                            }`}>
                                                            #{idx + 1}
                                                        </span>
                                                        <div className='truncate'>
                                                            <p className='text-sm font-bold text-gray-100 truncate'>{item.userName || 'Anonymous User'}</p>
                                                            <p className='text-[10px] text-gray-500 font-mono truncate'>ID: {item.userId}</p>
                                                        </div>

                                                    </div>
                                                    <div className='text-xs font-medium text-gray-400 block self-end sm:hidden'>
                                                        Score: <span className='text-white font-bold'>{item.correct}</span> / {item.total}
                                                    </div>
                                                </div>

                                                <div className='flex flex-col gap-3'>
                                                    <div className='text-right flex items-center gap-4 shrink-0 flex-col sm:flex-row'>
                                                        <div className='text-xs font-medium text-gray-400 hidden sm:block'>
                                                            Score: <span className='text-white font-bold'>{item.correct}</span> / {item.total}
                                                        </div>
                                                        <div className='bg-emerald-500/10 border border-emerald-500/20 px- py-1.5 rounded-xl text-center min-w-12'>
                                                            <p className='text-xs font-mono font-black text-emerald-400'>{item.percentage}%</p>
                                                        </div>
                                                    </div>
                                                    <Trash
                                                        type="button"
                                                        className='w-5 h-5 text-gray-400 hover:text-red-400 cursor-pointer transition-transform hover:scale-110 self-end mr-3'
                                                        onClick={(e) => handleDeleteClick(e, item.originalIdx)}
                                                        disabled={deletingId === item.originalIdx}
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500 space-y-2'>
                                    <span className='text-3xl'>😢</span>
                                    <p className='text-sm italic font-medium text-gray-400'>No participants have attempted this quiz room yet.</p>
                                    <p className='text-xs text-gray-600 max-w-sm'>Once students submit answers, their scoring arrays and identity models will pop up here in real-time.</p>
                                </div>
                            )}
                        </div>

                        <div className='border-t border-white/10 pt-4 text-right shrink-0'>
                            <button
                                onClick={() => { setIsModalOpen(false); setSelectedRoom(null); }}
                                className='px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition-all'
                            >
                                Close Audit View
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashBoard;