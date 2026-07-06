import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Home, 
    ShieldCheck, 
    ChevronDown, 
    User, 
    Mail, 
    Trophy, 
    FileText, 
    Bot, 
    Users, 
    History, 
    LogOut,
    ArrowRight 
} from 'lucide-react';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error("Loged Out! Please visit again ‼️")
        navigate('/login');
    };

    // Navigation
    const handleStartQuiz = () => navigate('/quiz');
    const handleStartAiQuiz = () => navigate('/ai-quiz');
    const handleViewHistory = () => navigate('/history');

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col bg-[#0b0c20] text-white font-sans selection:bg-purple-500/30">
            
            {/* Background Orbs & Grid */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(transparent_1px,#0b0c20_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

            
            {/* Main Content Dashboard Wrapper */}
            <main className="mt-20 flex-1 flex items-center justify-center px-4 py-5 relative z-10">
                
                {/* Glassmorphic Central Card */}
                <div className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 md:p-12 text-center relative overflow-hidden">
                    
                    {/* Decorative Top Trophy */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 text-white mb-6 shadow-lg shadow-indigo-500/20">
                        <Trophy className="w-6 h-6" />
                    </div>

                    {/* Main Headings */}
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
                        Welcome to Quiz App
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm mt-2 mb-8 font-medium">
                        Challenge yourself, learn new things, and compete with others!
                    </p>

                    {/* User Credentials Panel */}
                    {user && (
                        <div className="text-left mb-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] divide-y divide-white/[0.05]">
                            <div className="flex items-center gap-4 px-5 py-3.5">
                                <User className="w-4 h-4 text-purple-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Name</span>
                                    <span className="text-gray-200 font-medium text-sm md:text-base">{user.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-5 py-3.5">
                                <Mail className="w-4 h-4 text-cyan-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Email Address</span>
                                    <span className="text-gray-200 font-medium text-sm md:text-base break-all">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        You are successfully logged in.
                    </div>

                    {/* Dashboard Navigation Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        
                        {/* Predefined Quiz - Purple-Blue Deep Gloss Button */}
                        <button
                            onClick={handleStartQuiz}
                            className="group flex items-center justify-between p-4 rounded-2xl text-left bg-gradient-to-r from-[#171a4a] to-[#0f2d59] border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Start Predefined Quiz</p>
                                    <p className="text-[11px] text-gray-400">Standard crafted questions</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* AI Quiz - Deep Electric Blue Button */}
                        <button
                            onClick={handleStartAiQuiz}
                            className="group flex items-center justify-between p-4 rounded-2xl text-left bg-gradient-to-r from-[#101e4a] to-[#07366b] border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Start AI Quiz</p>
                                    <p className="text-[11px] text-gray-400">Dynamic generated options</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Join Room - Teal Gradient Button */}
                        <Link
                            to="/room"
                            className="group flex items-center justify-between p-4 rounded-2xl text-left bg-gradient-to-r from-[#0d283d] to-[#063a47] border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(20,184,166,0.2)] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Join Room</p>
                                    <p className="text-[11px] text-gray-400">Compete with online friends</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>

                        {/* Quiz History - Amber Warm Gradient Button */}
                        <button
                            onClick={handleViewHistory}
                            className="group flex items-center justify-between p-4 rounded-2xl text-left bg-gradient-to-r from-[#291e22] to-[#40241a] border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">View Quiz History</p>
                                    <p className="text-[11px] text-gray-400">Track scores and responses</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                    {/* Logout Action Bar */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-500/80 to-rose-600/90 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-500/10 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;