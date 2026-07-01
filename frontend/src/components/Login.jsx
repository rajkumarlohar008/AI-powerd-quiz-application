import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import Nav from './Nav';
import { toast } from 'react-toastify';


const Login = () => {

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);

    const navigate = useNavigate();


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setIsDisabled(true);

        setMessage('');
        setError('');

        try {

            const response = await axios.post(
                `${API_URL}/api/login`,
                formData
            );

            localStorage.setItem(
                'token',
                response.data.token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(response.data.user)
            );

            setMessage('Login successful!');
            toast.success("Login successful !")

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (err) {

            setError(
                err.response?.data?.message || 'Login failed'
            );
            toast.error(err.response?.data?.message || 'Login failed');
            setIsDisabled(false);
        }
    };

    return (

        <div className='
            relative
            min-h-screen
            overflow-hidden
            flex
            items-center
            justify-center
            bg-linear-to-br
            from-black
            via-slate-900
            to-purple-950
            px-4
        '>
            

            {/* Glow Effects */}

            <div className='
                absolute
                -top-25
                -left-25
                w-75
                h-75
                bg-cyan-500/20
                rounded-full
                blur-3xl
            ' />

            <div className='
                absolute
                -bottom-25
                -right-25
                w-75
                h-75
                bg-purple-500/20
                rounded-full
                blur-3xl
            ' />

            <Nav />
            {/* Login Card */}

            <div className='
                relative
                z-10
                w-full
                max-w-md
                p-8
                rounded-3xl
                border
                border-white/10
                bg-white/10
                backdrop-blur-xl
                shadow-2xl
            '>

                {/* Heading */}

                <h2 className='
                    text-4xl
                    font-extrabold
                    text-center
                    mb-8
                    bg-linear-to-r
                    from-cyan-400
                    via-blue-500
                    to-purple-500
                    bg-clip-text
                    text-transparent
                '>

                    Login

                </h2>

                {/* Form */}

                <form
                    onSubmit={handleSubmit}
                    className='space-y-6'
                >

                    {/* Email */}

                    <div>

                        <label className='
                            block
                            text-sm
                            font-semibold
                            text-gray-300
                            mb-2
                        '>

                            Email

                        </label>

                        <input
                            type='email'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder='Enter your email'
                            className='
                                w-full
                                px-4
                                py-3
                                rounded-xl
                                bg-white/10
                                border
                                border-white/10
                                text-white
                                placeholder-gray-400
                                outline-none
                                focus:ring-2
                                focus:ring-cyan-500
                                transition-all
                            '
                        />

                    </div>

                    {/* Password */}

                    <div>

                        <label className='
                            block
                            text-sm
                            font-semibold
                            text-gray-300
                            mb-2
                        '>

                            Password

                        </label>

                        <input
                            type='password'
                            name='password'
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder='Enter your password'
                            className='
                                w-full
                                px-4
                                py-3
                                rounded-xl
                                bg-white/10
                                border
                                border-white/10
                                text-white
                                placeholder-gray-400
                                outline-none
                                focus:ring-2
                                focus:ring-purple-500
                                transition-all
                            '
                        />

                    </div>

                    {/* Button */}

                    <button
                        type='submit'
                        disabled={isDisabled}
                        className='
                            w-full
                            py-3
                            rounded-xl
                            text-lg
                            font-bold
                            text-white
                            bg-linear-to-r
                            from-cyan-500
                            to-purple-600
                            hover:scale-[1.02]
                            active:scale-95
                            transition-all
                            duration-300
                            shadow-lg
                            hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        '
                    >

                        {isDisabled
                            ? 'Logging in...'
                            : 'Login'}

                    </button>

                </form>

                {/* Success Message */}

                {message && (

                    <p className='
                        text-green-400
                        text-center
                        mt-4
                        font-medium
                    '>

                        {message}

                    </p>

                )}

                {/* Error Message */}

                {error && (

                    <p className='
                        text-red-400
                        text-center
                        mt-4
                        font-medium
                    '>

                        {error}

                    </p>

                )}

                {/* Register Link */}

                <p className='
                    text-center
                    text-gray-300
                    mt-6
                '>

                    Don't have an account?{' '}

                    <Link
                        to='/register'
                        className='
                            text-cyan-400
                            hover:text-cyan-300
                            font-semibold
                        '
                    >

                        Register here

                    </Link>

                </p>

            </div>

        </div>
    );
};

export default Login;