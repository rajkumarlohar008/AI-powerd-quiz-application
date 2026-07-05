import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import Nav from './Nav';
import { toast } from 'react-toastify';
import { Check, X, Upload } from 'lucide-react';
import axios from 'axios';

const Register = () => {
    const [role, setRole] = useState("user");
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);

    const [rules, setRules] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
    });

    const navigate = useNavigate();

    const checkPasswordStrength = (password) => {
        setRules({
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    };

    const handleRoleChange = (selectedRole) => {
        setRole(selectedRole);
        setFormData(prev => ({
            ...prev,
            role: selectedRole
        }));
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        const trimmedName = formData.name.replace(/\s+/g, ' ').trim();
        const trimmedEmail = formData.email.trim().toLowerCase();
        const trimmedPassword = formData.password;

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

        const allRulesPassed = Object.values(rules).every(Boolean);
        if (!allRulesPassed) {
            const passwordErrorMessage = 'Your password does not meet all the security profile criteria shown below.';
            setError(passwordErrorMessage);
            toast.error(passwordErrorMessage);
            return;
        }

        setIsDisabled(true);

        // Preparing Multipart Form Data
        const formPayload = new FormData();
        
        const requestData = {
            name: trimmedName,
            email: trimmedEmail,
            password: trimmedPassword,
            role: formData.role,
        };

        // Spring Boot expects the 'request' part as a Blob with application/json content type
        formPayload.append("request", new Blob([JSON.stringify(requestData)], { type: "application/json" }));
        
        if (file) {
            formPayload.append("file", file);
        }

        try {
            const response = await axios.post(
                `${API_URL}/api/register`,
                formPayload,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setMessage(response.data.message);
            toast.success(response.data.message);

            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'user',
            });
            setFile(null);
            setPreviewUrl(null);
            setRole('user');
            setRules({
                minLength: false,
                hasUpper: false,
                hasLower: false,
                hasNumber: false,
                hasSpecial: false,
            });

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Registration failed:', error);
            const apiError = error.response?.data?.message || 'Registration failed. Please try again.';
            setError(apiError);
            toast.error(apiError);
        } finally {
            setIsDisabled(false);
        }
    };

    return (
        <div className='relative min-h-screen bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 pt-28 pb-10 flex justify-center items-center overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
            <Nav />
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

            <div className='relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-white flex flex-col justify-center'>
                <h2 className='text-3xl font-extrabold text-center mb-8 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'>
                    Create Account
                </h2>

                <div>
                    <label className='block text-sm font-semibold text-gray-300 mb-2'>
                        Role
                    </label>
                    <div className='flex gap-1 justify-around'>
                        <label className={`font-bold text-md w-1/2 text-center py-2 rounded-l-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer ${role === "user" ? "text-amber-500" : 'text-gray-300'}`}>
                            <input
                                className='hidden'
                                type="radio"
                                name="role"
                                value="user"
                                checked={role === "user"}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            />
                            User
                        </label>

                        <label className={`font-bold text-md w-1/2 text-center py-2 rounded-r-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer ${role === "admin" ? "text-amber-500" : 'text-gray-300'}`}>
                            <input
                                className='hidden'
                                type="radio"
                                name="role"
                                value="admin"
                                checked={role === "admin"}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            />
                            Admin
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='space-y-5'>
                    <div className='flex flex-col gap-2'>
                        <label className='mt-3 block text-sm font-semibold text-gray-300 mb-2'>Full Name</label>
                        <input
                            type='text'
                            name='name'
                            required
                            placeholder='Enter Name'
                            onChange={handleChange}
                            value={formData.name}
                            className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300'
                        />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <label className='block text-sm font-semibold text-gray-300 mb-2'>Email Address</label>
                        <input
                            type='email'
                            name='email'
                            required
                            placeholder='Enter Email'
                            onChange={handleChange}
                            value={formData.email}
                            className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300'
                        />
                    </div>

                    {/* Aesthetic Profile Image Input */}
                    <div className='flex flex-col gap-2'>
                        <label className='block text-sm font-semibold text-gray-300 mb-2'>Profile Picture <span className='text-xs text-gray-500 font-normal'>(Optional)</span></label>
                        <label className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 border-dashed hover:border-cyan-500/50 focus-within:border-cyan-500 text-white cursor-pointer transition-all duration-300 flex items-center gap-3 group'>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleFileChange}
                                className='hidden'
                            />
                            <div className='p-2 bg-white/5 rounded-lg group-hover:bg-cyan-500/10 transition-colors'>
                                <Upload className='w-4 h-4 text-gray-400 group-hover:text-cyan-400' />
                            </div>
                            <span className='text-sm text-gray-400 group-hover:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]'>
                                {file ? file.name : 'Choose an image...'}
                            </span>
                            {previewUrl && (
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className='w-8 h-8 rounded-full object-cover ml-auto border border-white/20'
                                />
                            )}
                        </label>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <label className='block text-sm font-semibold text-gray-300 mb-2'>Secure Password</label>
                        <input
                            type='password'
                            name='password'
                            required
                            placeholder='Enter Password'
                            onChange={handleChange}
                            value={formData.password}
                            className='w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-white outline-none text-sm transition-all duration-300'
                        />

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

                    <button
                        type='submit'
                        disabled={isDisabled}
                        className='w-full py-3 rounded-xl text-lg font-bold text-white bg-linear-to-r from-cyan-500 to-purple-600 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3'
                    >
                        {isDisabled && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isDisabled ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {message && (
                    <p className='text-green-400 text-center mt-4 font-medium text-sm'>
                        {message}
                    </p>
                )}

                {error && (
                    <p className='text-red-400 text-center mt-4 font-medium text-sm'>
                        {error}
                    </p>
                )}

                <p className='text-center text-gray-300 mt-6 text-sm'>
                    Already have an account?{' '}
                    <Link
                        to='/login'
                        className='text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200'
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;