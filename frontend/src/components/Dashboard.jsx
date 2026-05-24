import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

        navigate('/login');
    };

    // Navigation
    const handleStartQuiz = () => {
        navigate('/quiz');
    };

    const handleStartAiQuiz = () => {
        navigate('/ai-quiz');
    };

    const handleViewHistory = () => {
        navigate('/history');
    };

    return (

        <div className='
            relative
            min-h-[91vh]
            overflow-hidden
            flex
            items-center
            justify-center
            bg-gradient-to-br
                from-black
                via-slate-900
                to-purple-950
            px-4
        '>

            {/* <Nav /> */}

            {/* Glow Background */}

            <div className='
                absolute
                -top-30
                -left-30
                w-87.5
                h-87.5
                bg-cyan-500/20
                rounded-full
                blur-3xl
            ' />

            <div className='
                absolute
                -bottom-30
                -right-30
                w-87.5
                h-87.5
                bg-purple-500/20
                rounded-full
                blur-3xl
            ' />

            {/* Dashboard Card */}

            <div className='
                relative
                z-10
                w-full
                max-w-2xl
                rounded-3xl
                border
                border-white/10
                bg-white/10
                backdrop-blur-xl
                shadow-2xl
                p-8
                md:p-12
            '>

                {/* Heading */}

                <h1 className='
                    text-4xl
                    md:text-5xl
                    font-extrabold
                    text-center
                    mb-8
                    bg-gray-400
                    bg-clip-text
                    text-transparent
                '>

                    Welcome to Quiz App

                </h1>

                {/* User Info */}

                {user && (

                    <div className='
                        mb-8
                        rounded-2xl
                        bg-white/5
                        border
                        border-white/10
                        p-6
                        space-y-3
                    '>

                        <div className='flex items-center gap-3'>

                            <span className='text-cyan-400 font-bold'>
                                Name:
                            </span>

                            <span className='text-white text-lg'>
                                {user.name}
                            </span>

                        </div>

                        <div className='flex items-center gap-3'>

                            <span className='text-purple-400 font-bold'>
                                Email:
                            </span>

                            <span className='text-white text-lg break-all'>
                                {user.email}
                            </span>

                        </div>

                    </div>

                )}

                {/* Message */}

                <p className='
                    text-center
                    text-gray-300
                    text-lg
                    mb-10
                '>

                    You are successfully logged in.

                </p>

                {/* Buttons */}

                <div className='
                    flex
                    flex-col
                    gap-5
                '>

                    {/* Quiz Buttons */}

                    <div className='
                        flex
                        flex-col
                        md:flex-row
                        gap-4
                    '>

                        {/* Predefined Quiz */}

                        <button
                            onClick={handleStartQuiz}
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-[#093C5D]
                                hover:scale-[1.03]
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-lg
                                hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]
                            '
                        >

                            Start Predefined Quiz

                        </button>

                        {/* AI Quiz */}

                        <button
                            onClick={handleStartAiQuiz}
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-[#093C5D]
                                hover:scale-[1.03]
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-lg
                                hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                            '
                        >

                            Start AI Quiz

                        </button>

                    </div>

                    <div className='
                        flex
                        flex-col
                        md:flex-row
                        gap-4
                    '>
                        <Link
                            to={"/room"}
                            className='
                            flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-[#093C5D]
                                hover:scale-[1.03]
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-lg
                                hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                                text-center                        '
                        >

                            Join Room

                        </Link>

                        {/* History Button */}


                        <button
                            onClick={handleViewHistory}
                            className='
                            flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-[#093C5D]
                                hover:scale-[1.03]
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-lg
                                hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]
                        '
                        >

                            View Quiz History

                        </button>

                    </div>



                    {/* Logout Button */}

                    <button
                        onClick={handleLogout}
                        className='
                            w-full
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            text-white
                            bg-linear-to-r
                            from-red-500
                            to-rose-600
                            hover:scale-[1.02]
                            active:scale-95
                            transition-all
                            duration-300
                            shadow-lg
                            hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]
                        '
                    >

                        Logout

                    </button>

                </div>

            </div>

        </div>
    );
};

export default Dashboard;