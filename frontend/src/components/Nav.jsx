import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShieldCheck, ChevronDown, X, LogOut, Check, SquarePen, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios'; 
import API_URL from '../config';

const Nav = () => {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);
    const [profileImage , setProfileImage] = useState('');
    
    // New File upload states
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    let [user, setUser] = useState({});
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Fallback to user's image or Dicebear generator
        const fallbackImg = user.imageUrl || user.imageURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
        setProfileImage(fallbackImg);
    }, [user]);

    const handleLogout = (msg) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error(msg || "Logged Out! Please visit again ‼️");
        navigate('/login');
    };

    const getLocalUser = () => {
        try {
            const data = localStorage.getItem('user');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    };

    const [formData, setFormData] = useState({
        name: getLocalUser()?.name || '',
        email: getLocalUser()?.email || '',
        password: '',
    });

    useEffect(() => {
        const userData = getLocalUser();
        if (userData) {
            setUser(userData);
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                password: '',
            });
        }
        // Reset file selection states when opening/closing modal
        setFile(null);
        setPreviewUrl(null);
        setRemoveImage(false);
    }, [isModelOpen]);

    const [rules, setRules] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
    });

    const checkPasswordStrength = (password) => {
        setRules({
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[@$!%*?&]/.test(password),
        });
    };

    const closeModal = () => {
        setIsModelOpen(false);
        setIsSidebarOpen(false);
        setIsUpdate(false);
        setError('');
        setMessage('');
        setFile(null);
        setPreviewUrl(null);
        setRemoveImage(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setRemoveImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        toast.info("Updating your account, Please wait for a moment !!");
        const name = formData.name || user.name;
        const email = formData.email || user.email;
        const password = formData.password;

        const trimmedName = name.replace(/\s+/g, ' ').trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password;

        if (trimmedName.length < 3) {
            toast.error("Name must contain at least 3 characters.");
            return;
        }

        if (!/^[A-Za-z ]+$/.test(trimmedName)) {
            toast.error("Name can contain only letters.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        if (trimmedPassword && !Object.values(rules).every(Boolean)) {
            const passwordErrorMessage = 'Your password does not meet all the security profile criteria shown below.';
            setError(passwordErrorMessage);
            toast.error(passwordErrorMessage);
            return;
        }

        // Prepare object mapping exactly to UpdateRequest structure
        const updateRequestPayload = {
            id: user.id,
            name: trimmedName,
            email: trimmedEmail,
            role: user.role,
            ...(trimmedPassword ? { password: trimmedPassword } : {})
        };

        setIsDisabled(true);

        // Building Multipart Form Data payload
        const formPayload = new FormData();
        formPayload.append("user", new Blob([JSON.stringify(updateRequestPayload)], { type: "application/json" }));
        
        if (file) {
            formPayload.append("file", file);
        }
        
        try {
            const token = localStorage.getItem('token');

            // POST with file data & append query routing fields expected by backend
            const response = await axios.put(
                `${API_URL}/api/acc/update?removeImage=${removeImage}`,
                formPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setMessage(response.data.message);
            toast.success(response.data.message);

            if (response.data.emailUpdate) {
                handleLogout("Email updated! Please verify your email and login again.");
            } else if (response.data.user) {
                localStorage.setItem(
                    'user',
                    JSON.stringify(response.data.user)
                );
                setUser(response.data.user);
            }

            setFormData({
                name: '',
                email: '',
                password: '',
            });
            setRules({
                minLength: false,
                hasUpper: false,
                hasLower: false,
                hasNumber: false,
                hasSpecial: false,
            });

            setTimeout(() => {
                closeModal();
            }, 1000);
        } catch (error) {
            console.error('updation failed:', error);
            const apiError = error.response?.data?.message || 'Updation failed. Please try again.';
            setError(apiError);
            toast.error(apiError);
        } finally {
            setIsDisabled(false);
        }
    };

    return (
        <>
            {/* Header */}
            <header className='fixed top-0 left-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/60 backdrop-blur-md'>

                {/* Left Section */}
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

                    {/* Desktop Nav */}
                    <nav className='hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400'>
                        {location.pathname === "/dashboard" || location.pathname === "/login" ? (
                            <Link to='/' className='flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition'>
                                <Home className='w-4 h-4' />
                                Home
                            </Link>
                        ) : (
                            <Link to='/dashboard' className='flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition'>
                                <Home className='w-4 h-4' />
                                Dashboard
                            </Link>
                        )}

                        {user?.role === 'admin' && (
                            <Link to='/admin' className='flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-white/10 hover:text-white transition'>
                                <ShieldCheck className='w-4 h-4' />
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Profile */}
                {user?.name && (
                    <div onClick={() => setIsSidebarOpen(true)} className='flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 hover:bg-white/10 transition cursor-pointer'>
                        <img src={profileImage} alt='Avatar' className='w-8 h-8 rounded-full bg-slate-800 border object-cover border-white/20' />
                        <div className='hidden sm:block text-left'>
                            <p className='text-[10px] text-gray-400 leading-none'>Welcome,</p>
                            <p className='text-xs font-semibold text-gray-200'>{user.name}</p>
                        </div>
                        <ChevronDown className='w-3.5 h-3.5 text-gray-400' />
                    </div>
                )}
            </header>

            {/* Sidebar Drawer */}
            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div onClick={() => setIsSidebarOpen(false)} className='absolute inset-0 bg-black/60 backdrop-blur-xs' />
                <div className={`absolute top-0 right-0 h-full w-72 max-w-[80vw] border-l border-white/10 bg-slate-950/90 backdrop-blur-xl p-6 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className='flex items-center justify-between pb-6 border-b border-white/5 mb-6'>
                        <div onClick={() => setIsModelOpen(true)} className='flex items-center gap-3 cursor-pointer'>
                            <img src={profileImage} alt='Avatar' className='w-10 h-10 rounded-full bg-slate-800 border border-white/20 object-cover' />
                            <div className='text-left'>
                                <p className='text-[10px] text-gray-400 leading-none'>User Profile</p>
                                <p className='text-sm font-bold text-white mt-1'>{user?.name}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className='p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition'>
                            <X className='w-5 h-5' />
                        </button>
                    </div>

                    <nav className='flex flex-col gap-3 text-base font-semibold'>
                        {location.pathname === "/dashboard" ? (
                            <Link to='/' onClick={() => setIsSidebarOpen(false)} className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 text-gray-200 border border-white/5 hover:bg-white/10 transition'>
                                <Home className='w-5 h-5' />
                                Home
                            </Link>
                        ) : (
                            <Link to='/dashboard' onClick={() => setIsSidebarOpen(false)} className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 text-gray-200 border border-white/5 hover:bg-white/10 transition'>
                                <Home className='w-5 h-5' />
                                Dashboard
                            </Link>
                        )}

                        {user?.role === 'admin' && (
                            <Link to='/admin' onClick={() => setIsSidebarOpen(false)} className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 text-gray-200 border border-white/5 hover:bg-white/10 transition'>
                                <ShieldCheck className='w-5 h-5 text-purple-400' />
                                Admin Panel
                            </Link>
                        )}

                        <button onClick={() => handleLogout()} className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-500/80 to-rose-600/90 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-500/10 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99]">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </nav>
                </div>
            </div>

            {/* Modal */}
            {isModelOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={closeModal}>
                    <div className="flex flex-col p-8 w-90 md:w-120 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className='self-end flex gap-4 items-center'>
                            <SquarePen onClick={() => setIsUpdate(!isUpdate)} className={`w-5 h-5 cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isUpdate ? 'text-amber-400' : 'text-gray-400'}`} />
                            <X onClick={closeModal} className='w-7 h-7 text-red-400 hover:text-red-600 cursor-pointer transition-transform hover:scale-110 active:scale-95' />
                        </div>

                        {/* Profile Image Wrapper with Glow Plus Icon Layer */}
                        <div className='relative self-center group mt-2'>
                            <img 
                                src={previewUrl || profileImage} 
                                alt='Avatar' 
                                className='w-20 h-20 rounded-full bg-slate-800 object-cover border border-white/20' 
                            />
                            {isUpdate && (
                                <label className='absolute bottom-0 right-0 p-1 rounded-full bg-amber-500 border border-white/20  text-white cursor-pointer hover:bg-amber-400 active:scale-90 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95'>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                        className="hidden" 
                                    />
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </label>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-5'>
                            <div className='flex flex-col gap-2'>
                                <label className='mt-3 block text-sm font-semibold text-gray-300 mb-2'>Full Name</label>
                                {isUpdate ? (
                                    <input type='text' name='name' required placeholder='Enter Name' onChange={handleChange} value={formData.name} className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300' />
                                ) : (
                                    <div className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm'>{user?.name}</div>
                                )}
                            </div>

                            <div className='flex flex-col gap-2'>
                                <label className='block text-sm font-semibold text-gray-300 mb-2'>Email Address</label>
                                {isUpdate ? (
                                    <input type='email' name='email' required placeholder='Enter Email' onChange={handleChange} value={formData.email} className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300' />
                                ) : (
                                    <div className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm'>{user?.email}</div>
                                )}
                            </div>

                            <div className={`flex flex-col gap-2 ${isUpdate ? 'block' : 'hidden'}`}>
                                <label className='block text-sm font-semibold text-gray-300 mb-2'>Secure Password</label>
                                <input type='password' name='password' placeholder='Change password or enter current password' onChange={handleChange} value={formData.password} className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300' />

                                {formData.password && (
                                    <div className="mt-2 p-3 bg-black/30 border border-white/5 rounded-xl space-y-1.5 transition-all duration-300">
                                        <div className="flex items-center gap-2 text-xs">
                                            {rules.minLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                            <span className={rules.minLength ? 'text-emerald-300 font-medium' : 'text-gray-400'}>At least 8 characters long</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {rules.hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                            <span className={rules.hasUpper ? 'text-emerald-300 font-medium' : 'text-gray-400'}>At least one uppercase letter (A-Z)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {rules.hasLower ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                            <span className={rules.hasLower ? 'text-emerald-300 font-medium' : 'text-gray-400'}>At least one lowercase letter (a-z)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {rules.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                            <span className={rules.hasNumber ? 'text-emerald-300 font-medium' : 'text-gray-400'}>At least one number (0-9)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {rules.hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-gray-500" />}
                                            <span className={rules.hasSpecial ? 'text-emerald-300 font-medium' : 'text-gray-400'}>At least one special symbol (@$!%*?&)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type='submit' disabled={isDisabled} className={`flex-1 text-lg hover:border-blue-400/40 duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white ${isUpdate ? 'block' : 'hidden'}`}>
                                {isDisabled ? 'Updating...' : 'Update'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Nav;