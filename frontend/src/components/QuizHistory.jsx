import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const QuizHistory = () => {

    const [user, setUser] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // Fetch History
    useEffect(() => {

        const token = localStorage.getItem('token');

        const userData = localStorage.getItem('user');

        if (!token) {

            navigate('/login');

            return;
        }

        const u = userData
            ? JSON.parse(userData)
            : null;

        setUser(u);

        if (!u?.id) {

            setLoading(false);

            return;
        }

        axios
            .get(
                `${API_URL}/api/quiz-history`,
                {
                    params: {
                        userId: u.id
                    }
                }
            )
            .then((res) => {

                setHistory(res.data);

            })
            .catch(() => {

                setError(
                    'Failed to load quiz history.'
                );

            })
            .finally(() => {

                setLoading(false);

            });

    }, [navigate]);

    // Dashboard
    const handleDashboard = () => {

        navigate('/dashboard');

    };

    // Loading
    if (loading) {

        return (

            <div className='
                min-h-screen
                flex
                items-center
                justify-center
                bg-linear-to-br
                from-black
                via-slate-900
                to-purple-950
            '>

                <div className='
                    text-cyan-400
                    text-3xl
                    font-bold
                    animate-pulse
                '>

                    Loading Quiz History...

                </div>

            </div>
        );
    }

    // Error
    if (error) {

        return (

            <div className='
                min-h-screen
                flex
                items-center
                justify-center
                bg-linear-to-br
                from-black
                via-slate-900
                to-purple-950
                px-4
            '>

                <div className='
                    w-full
                    max-w-xl
                    rounded-3xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    backdrop-blur-xl
                    p-8
                    text-center
                '>

                    <p className='
                        text-red-400
                        text-xl
                        font-semibold
                        mb-6
                    '>

                        {error}

                    </p>

                    <button
                        type='button'
                        onClick={handleDashboard}
                        className='
                            px-6
                            py-3
                            rounded-2xl
                            text-white
                            font-bold
                            bg-linear-to-r
                            from-cyan-500
                            to-purple-600
                            hover:scale-105
                            active:scale-95
                            transition-all
                            duration-300
                        '
                    >

                        Back to Dashboard

                    </button>

                </div>

            </div>
        );
    }

    const attempts = history?.attempts || [];

    const totalAttempts =
        history?.totalAttempts ?? 0;

    const averagePercentage =
        history?.averagePercentage ?? 0;

    return (

        <div className='
            relative
            min-h-screen
            overflow-hidden
            bg-linear-to-br
            from-black
            via-slate-900
            to-purple-950
            flex
            items-center
            justify-center
            px-4
            py-10
        '>

            {/* Glow Effects */}

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

            {/* Main Card */}

            <div className='
                relative
                z-10
                w-full
                max-w-5xl
                rounded-3xl
                border
                border-white/10
                bg-white/10
                backdrop-blur-xl
                shadow-2xl
                p-6
                md:p-10
            '>

                {/* Heading */}

                <div className='text-center mb-10'>

                    <h1 className='
                        text-4xl
                        md:text-5xl
                        font-extrabold
                        bg-linear-to-r
                        from-cyan-400
                        via-blue-500
                        to-purple-500
                        bg-clip-text
                        text-transparent
                        mb-4
                    '>

                        Quiz History

                    </h1>

                    {user && (

                        <p className='
                            text-gray-300
                            text-lg
                        '>

                            {user.name} — view your
                            past quiz attempts and
                            performance.

                        </p>

                    )}

                </div>

                {/* Stats */}

                <div className='
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-6
                    mb-12
                '>

                    {/* Average */}

                    <div className='
                        rounded-2xl
                        bg-cyan-500/10
                        border
                        border-cyan-500/20
                        p-8
                        text-center
                    '>

                        <h2 className='
                            text-5xl
                            font-extrabold
                            text-cyan-400
                            mb-3
                        '>

                            {
                                totalAttempts === 0
                                    ? '—'
                                    : `${averagePercentage.toFixed(1)}%`
                            }

                        </h2>

                        <p className='
                            text-gray-300
                            text-lg
                        '>

                            Overall Average

                        </p>

                    </div>

                    {/* Total Attempts */}

                    <div className='
                        rounded-2xl
                        bg-purple-500/10
                        border
                        border-purple-500/20
                        p-8
                        text-center
                    '>

                        <h2 className='
                            text-5xl
                            font-extrabold
                            text-purple-400
                            mb-3
                        '>

                            {totalAttempts}

                        </h2>

                        <p className='
                            text-gray-300
                            text-lg
                        '>

                            Total Attempts

                        </p>

                    </div>

                </div>

                {/* History List */}

                {

                    attempts.length === 0

                        ? (

                            <div className='
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                p-8
                                text-center
                            '>

                                <p className='
                                    text-gray-300
                                    text-lg
                                '>

                                    No quiz attempts yet.
                                    Complete a quiz to
                                    see your history here.

                                </p>

                            </div>

                        )

                        : (

                            <div>

                                <h2 className='
                                    text-3xl
                                    font-bold
                                    text-white
                                    mb-8
                                '>

                                    Previous Attempts

                                </h2>

                                <div className='space-y-5'>

                                    {

                                        attempts.map((attempt) => (

                                            <div
                                                key={attempt.id}
                                                className='
                                                    rounded-2xl
                                                    border
                                                    border-white/10
                                                    bg-white/5
                                                    backdrop-blur-lg
                                                    p-6
                                                    flex
                                                    flex-col
                                                    md:flex-row
                                                    md:items-center
                                                    md:justify-between
                                                    gap-4
                                                    hover:bg-white/10
                                                    transition-all
                                                    duration-300
                                                '
                                            >

                                                {/* Quiz Type */}

                                                <div>

                                                    <h3 className='
                                                        text-xl
                                                        font-bold
                                                        text-white
                                                        mb-2
                                                    '>

                                                        {
                                                            attempt.quizType === 'AI'
                                                                ? 'AI Quiz'
                                                                : 'Predefined Quiz'
                                                        }

                                                    </h3>

                                                    <p className='
                                                        text-gray-400
                                                    '>

                                                        {
                                                            attempt.createdAt
                                                                ? new Date(
                                                                    attempt.createdAt
                                                                  ).toLocaleString()
                                                                : '—'
                                                        }

                                                    </p>

                                                </div>

                                                {/* Score */}

                                                <div className='
                                                    flex
                                                    items-center
                                                    gap-4
                                                '>

                                                    <div className='
                                                        px-5
                                                        py-3
                                                        rounded-2xl
                                                        bg-linear-to-r
                                                        from-cyan-500
                                                        to-purple-600
                                                        text-white
                                                        font-bold
                                                        text-lg
                                                        shadow-lg
                                                    '>

                                                        {
                                                            attempt.correct
                                                        }
                                                        /
                                                        {
                                                            attempt.total
                                                        }

                                                    </div>

                                                    <div className='
                                                        text-2xl
                                                        font-extrabold
                                                        text-cyan-400
                                                    '>

                                                        {
                                                            attempt.percentage.toFixed(0)
                                                        }%

                                                    </div>

                                                </div>

                                            </div>

                                        ))

                                    }

                                </div>

                            </div>

                        )

                }

                {/* Button */}

                <div className='mt-12'>

                    <button
                        type='button'
                        onClick={handleDashboard}
                        className='
                            w-full
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            text-white
                            bg-linear-to-r
                            from-cyan-500
                            to-purple-600
                            hover:scale-[1.02]
                            active:scale-95
                            transition-all
                            duration-300
                            shadow-lg
                            hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                        '
                    >

                        Back to Dashboard

                    </button>

                </div>

            </div>

        </div>
    );
};

export default QuizHistory;