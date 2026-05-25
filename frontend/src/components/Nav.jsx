import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShieldCheck, ChevronDown, X } from 'lucide-react';

const Nav = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        setUser(JSON.parse(userData));
    }, [navigate]);

    return (
        <>
            <header className='fixed top-0 left-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-md'>

                <div className='px-0 md:px-10 flex items-center gap-6'>

                    {/* Logo */}
                    <div className='flex items-center gap-2 font-black text-xl tracking-wide text-white'>

                        <span className='bg-linear-to-r from-amber-400 via-pink-500 to-purple-600 p-1.5 rounded-lg text-white inline-flex items-center justify-center'>

                            <svg className='w-5 h-5 fill-current' viewBox='0 0 24 24'>
                                <path d='M19 11h-6V3a1 1 0 0 0-1.707-.707l-9 9a1 1 0 0 0 .707 1.707h6v8a1 1 0 0 0 1.707.707l9-9A1 1 0 0 0 19 11z' />
                            </svg>

                        </span>

                        Quiz App

                    </div>

                    {/* Nav (Desktop Only) */}
                    <nav className='hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400'>

                        {location.pathname === "/dashboard" ? 
                        <Link
                            to='/'
                            className='flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition'
                        >
                            <Home className='w-4 h-4' />
                            Home
                        </Link>
                        : <Link
                            to='/dashboard'
                            className='flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition'
                        >
                            <Home className='w-4 h-4' />
                            Dashboard
                        </Link>}

                        {user?.role === 'admin' && (

                            <Link
                                to='/admin'
                                className='flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition'
                            >
                                <ShieldCheck className='w-4 h-4' />
                                Admin
                            </Link>

                        )}

                    </nav>
                </div>

                {/* Profile Element (Click handler opens menu on mobile, or can toggle drawer) */}
                {user && (

                    <div
                        onClick={() => setIsSidebarOpen(true)}
                        className='flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition cursor-pointer'
                    >

                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                            alt='Avatar'
                            className='w-8 h-8 rounded-full bg-slate-800 border border-white/20'
                        />

                        <div className='hidden sm:block text-left'>
                            <p className='text-[10px] text-gray-400 leading-none'>
                                Welcome,
                            </p>
                            <p className='text-xs font-semibold text-gray-200'>
                                {user.name}
                            </p>
                        </div>

                        <ChevronDown className='w-3.5 h-3.5 text-gray-400' />

                    </div>
                )}

            </header>

            {/* Responsive Mobile Drawer Menu */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop Overlay filter */}
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className='absolute inset-0 bg-black/60 backdrop-blur-xs'
                />

                {/* Sidebar Content Panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-72 max-w-[80vw] border-l border-white/10 bg-slate-950/90 backdrop-blur-xl p-6 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    {/* Header within Drawer */}
                    <div className='flex items-center justify-between pb-6 border-b border-white/5 mb-6'>
                        <div className='flex items-center gap-3'>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                alt='Avatar'
                                className='w-10 h-10 rounded-full bg-slate-800 border border-white/20'
                            />
                            <div className='text-left'>
                                <p className='text-[10px] text-gray-400 leading-none'>User Profile</p>
                                <p className='text-sm font-bold text-white mt-1'>{user?.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className='p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition'
                        >
                            <X className='w-5 h-5' />
                        </button>
                    </div>

                    {/* Mobile Navigation List Actions */}
                    <nav className='flex flex-col gap-3 text-base font-semibold'>
                        <Link
                            to='/dashboard'
                            onClick={() => setIsSidebarOpen(false)}
                            className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 active:bg-blue-600/20 transition'
                        >
                            <Home className='w-5 h-5' />
                            Dashboard
                        </Link>

                        {user?.role === 'admin' && (
                            <Link
                                to='/admin'
                                onClick={() => setIsSidebarOpen(false)}
                                className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 text-gray-200 border border-white/5 hover:bg-white/10 active:scale-98 transition'
                            >
                                <ShieldCheck className='w-5 h-5 text-purple-400' />
                                Admin Panel
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </>
    )
}

export default Nav
