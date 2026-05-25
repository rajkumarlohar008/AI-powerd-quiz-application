import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, ShieldCheck } from 'lucide-react';
import Nav from './Nav';

const AdminDashBoard = () => {
    const [roomTitle, setRoomTitle] = useState('');
    const [rooms, setRooms] = useState([]);
    const [questions, setQuestions] = useState([
        {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [createdRoom, setCreatedRoom] = useState(null);

    // --- MODAL & RESPONSES STATES ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomResponses, setRoomResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);

    // Get email safely inside or dynamically
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const token = localStorage.getItem('token') || '';
    const userEmail = user.email;

    // Fetch rooms on mount & when email changes
    useEffect(() => {
        if (!userEmail) return;

        axios.get(`${API_URL}/api/room/all`, {
            params: { email: userEmail },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => {
                setRooms(res.data || []);
            })
            .catch((err) => {
                console.error("Failed to load existing rooms:", err);
            });
    }, [userEmail]);

    const [deletingRoomId, setDeletingRoomId] = useState(null);

    const handleRoomDeleteClick = async (e, roomId) => {
        e.stopPropagation();

        setDeletingRoomId(roomId);

        try {
            await handleDelete(roomId);
        } finally {
            setDeletingRoomId(null);
        }
    };

    // FIXED: Added roomId parameter payload to the delete endpoint 
    // FIXED: Cleaned up modal state if active room is deleted
    const handleDelete = async (roomId) => {
        if (!roomId) return;

        try {
            console.log("Deleting room:", roomId);
            await axios.delete(`${API_URL}/api/room/delete`, {
                params: {
                    email: userEmail,
                    roomId: roomId // Sending the actual room identity to backend
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // If the deleted room is currently active in the modal view, close it
            if (selectedRoom && (selectedRoom.id === roomId || selectedRoom._id === roomId)) {
                setIsModalOpen(false);
                setSelectedRoom(null);
            }

            // Refresh room logs
            const res = await axios.get(`${API_URL}/api/room/all`, {
                params: { email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setRooms(res.data || []);
        } catch (err) {
            console.error("Failed to delete room:", err);
        }
    };

    // Fetch responses and open pop-up modal
    const handleSelectRoom = async (room) => {
        const roomId = room.id || room._id;
        if (!roomId) return;

        setSelectedRoom(room);
        setIsModalOpen(true);
        setLoadingResponses(true);
        setRoomResponses([]);

        try {
            const res = await axios.get(`${API_URL}/api/room/${roomId}/responses`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setRoomResponses(res.data || []);
        } catch (err) {
            console.error("Error fetching room responses:", err);
            setRoomResponses([]);
        } finally {
            setLoadingResponses(false);
        }
    };

    // Add Question
    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
            }
        ]);
    };

    // Remove Question
    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        const updated = questions.filter((_, idx) => idx !== index);
        setQuestions(updated);
    };

    // Update Question Title
    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = {
            ...updated[index],
            [field]: value
        };
        setQuestions(updated);
    };

    // Update Specific Option Text
    const updateOption = (qIndex, oIndex, value) => {
        const updated = [...questions];
        const updatedOptions = [...updated[qIndex].options];
        updatedOptions[oIndex] = value;
        updated[qIndex] = {
            ...updated[qIndex],
            options: updatedOptions
        };
        setQuestions(updated);
    };

    // Create Room Submit
    const handleCreateRoom = async () => {
        if (!roomTitle.trim()) {
            setMessage('Please enter a room title.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const payload = {
                roomName: roomTitle,
                questions,
            };

            const res = await axios.post(`${API_URL}/api/room`, payload, {
                params: { email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setCreatedRoom(res.data);
            setMessage('Quiz room created successfully!');

            setRoomTitle('');
            setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);

            if (userEmail) {
                const refreshedRooms = await axios.get(`${API_URL}/api/room/all`, {
                    params: { email: userEmail },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setRooms(refreshedRooms.data || []);
            }

        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-black via-slate-900 to-purple-950 px-4 py-10 text-white'>
            {/* Glow Background Rings */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl pointer-events-none' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none' />

            <Nav />
            {/* Main Wrapper Panel Container */}
            <div className='mt-15 relative z-10 max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-10'>

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
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>

                    {/* LEFT WORKSPACE */}
                    <div className='lg:col-span-2 space-y-6'>

                        {/* Box Panel 1: Room Config Setup */}
                        <div className='rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4'>
                            <h2 className='text-xl font-bold text-cyan-400 border-b border-white/5 pb-2'>Room Configuration</h2>
                            <div>
                                <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Quiz Room Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Javascript Advanced Core Patterns"
                                    value={roomTitle}
                                    onChange={(e) => setRoomTitle(e.target.value)}
                                    className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 text-white outline-none transition-all'
                                />
                            </div>
                        </div>

                        {/* Box Panel 2: Interactive Dynamic Questions Compiler Setup */}
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-bold text-purple-400'>Quiz Blueprint Questions ({questions.length})</h2>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className='px-4 py-2 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl transition-all'
                                >
                                    + Add Question Item
                                </button>
                            </div>

                            {questions.map((q, qIdx) => (
                                <div key={qIdx} className='rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4 relative overflow-hidden'>
                                    <div className='flex items-center justify-between border-b border-white/5 pb-2'>
                                        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm'>
                                            {qIdx + 1}
                                        </span>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(qIdx)}
                                                className='text-xs text-rose-400 hover:text-rose-300 transition-colors'
                                            >
                                                Delete Element
                                            </button>
                                        )}
                                    </div>

                                    {/* Question Title Input */}
                                    <div>
                                        <label className='block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>Question Statement</label>
                                        <input
                                            type="text"
                                            placeholder="Enter the quiz question text..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                                            className='w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-purple-500 text-sm transition-all'
                                        />
                                    </div>

                                    {/* Grid Options Input Area */}
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className='space-y-1'>
                                                <label className='text-[11px] font-bold text-gray-500 uppercase tracking-wider block'>Option {oIdx + 1}</label>
                                                <input
                                                    type="text"
                                                    placeholder={`Option value ${oIdx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                    className='w-full px-3 py-2 rounded-xl bg-black/20 border border-white/5 text-white text-sm outline-none focus:border-white/20 transition-all'
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
                                            className='px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-emerald-400 outline-none cursor-pointer focus:border-emerald-500/40 transition-all'
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
                                onClick={handleCreateRoom}
                                disabled={loading}
                                className='w-full py-5 mx-auto rounded-2xl font-bold text-xl text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] disabled:opacity-50'
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

                    {/* RIGHT SIDEBAR */}
                    <div className='space-y-6'>

                        {/* Live Room Info Callout Box */}
                        {createdRoom && (
                            <div className='rounded-3xl border border-purple-500/20 bg-purple-500/10 p-6 space-y-4'>
                                <h2 className='text-xl font-bold text-white'>Room Created Successfully 🎉</h2>
                                <div className='space-y-3 text-gray-300 text-base'>
                                    <div>
                                        <span className='text-cyan-400 font-bold block mb-1'>Room ID:</span>
                                        <span className='font-mono block bg-black/30 p-3 rounded-xl border border-white/10 text-sm break-all select-all'>{createdRoom.id || createdRoom._id}</span>
                                    </div>
                                    <div>
                                        <span className='text-cyan-400 font-bold'>Title:</span>{' '}{createdRoom.roomName || createdRoom.title}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Existing Registries Directory Log Grid */}
                        <div className='rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl'>
                            <h3 className='text-lg font-bold text-white border-b border-white/5 pb-2'>Active Quiz Registries</h3>
                            <p className='text-xs text-gray-400 italic -mt-2 mb-1'>💡 Click a room card to view user scores inside the live pop-up.</p>

                            {rooms && rooms.length > 0 ? (
                                <div className='space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 overflow-x-hidden'>
                                    {rooms.map((room, idx) => {
                                        const roomId = room.id || room._id;
                                        return (
                                            <div
                                                key={roomId || idx}
                                                onClick={() => handleSelectRoom(room)}
                                                className='p-4 rounded-xl cursor-pointer bg-black/30 border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 hover:scale-[1.02] transition-all duration-200 '
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <h4 className='font-bold text-sm text-gray-200 group-hover:text-cyan-300 truncate mr-2'>
                                                        {room.roomName || room.title || 'Untitled Room'}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        className='bg-red-500 text-xs px-2 py-1 rounded-md font-semibold hover:bg-red-400 active:scale-95 transition-all disabled:opacity-70'
                                                        onClick={(e) => handleRoomDeleteClick(e, roomId)}
                                                        disabled={deletingRoomId === roomId}
                                                    >
                                                        {deletingRoomId === roomId ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                                <div className='flex items-center justify-between text-[11px] text-gray-400 font-mono mt-2.5'>
                                                    <span className='truncate max-w-[150px] text-gray-500 font-semibold'>{roomId}</span>
                                                    <span className='shrink-0 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-300 font-sans font-semibold'>
                                                        {room.questions?.length || 0} Qs
                                                    </span>
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
            </div>

            {/* MODAL OVERLAY POP-UP PORTAL */}
            {isModalOpen && selectedRoom && (
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
                                <p className='text-xs text-gray-400 font-mono mt-0.5'>Room ID: {selectedRoom.id || selectedRoom._id}</p>
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
                            ) : roomResponses && roomResponses.length > 0 ? (
                                <div className='space-y-3'>
                                    <div className='text-xs text-emerald-400 font-bold tracking-wide flex items-center gap-1.5 mb-2'>
                                        <span>🏆</span> Leaderboard Standings (Sorted by Percentage Accuracy):
                                    </div>

                                    {[...roomResponses]
                                        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
                                        .map((item, idx) => (
                                            <div
                                                key={item.userId || idx}
                                                className='p-4 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between gap-4 shadow-sm hover:bg-black/60 transition-colors'
                                            >
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

                                                <div className='text-right flex items-center gap-4 shrink-0'>
                                                    <div className='text-xs font-medium text-gray-400 hidden sm:block'>
                                                        Score: <span className='text-white font-bold'>{item.correct}</span> / {item.total}
                                                    </div>
                                                    <div className='bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-center min-w-[75px]'>
                                                        <p className='text-xs font-mono font-black text-emerald-400'>{item.percentage}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className='flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500 space-y-2'>
                                    <span className='text-3xl'>👻</span>
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
