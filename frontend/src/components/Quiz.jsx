import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import Result from './Result';

const Quiz = () => {

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

    // Fetch Quiz Questions
    useEffect(() => {

        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        const fetchQuestions = async () => {

            try {

                const response = await axios.get(
                    `${API_URL}/api/quiz`
                );

                setQuestions(response.data.questions);

                setLoading(false);

            } catch (err) {

                setError('Failed to load quiz questions');

                setLoading(false);
            }
        };

        fetchQuestions();

    }, [navigate]);

    // Timer
    useEffect(() => {

        if (loading || showResult) return;

        const timer = setInterval(() => {

            setTimeLeft((prev) => {

                if (prev <= 1) {

                    handleNext();

                    return 30;
                }

                return prev - 1;

            });

        }, 1000);

        return () => clearInterval(timer);

    }, [currentQuestion, loading, showResult]);

    // Select Answer
    const handleAnswerSelect = (index) => {
        setSelectedAnswer(index);
    };

    // Next Question
    const handleNext = () => {

        if (
            currentQuestion === questions.length - 1 &&
            isFinishDisabled
        ) {
            return;
        }

        if (currentQuestion === questions.length - 1) {
            setIsFinishDisabled(true);
        }

        const newAnswers = [...userAnswers];

        newAnswers[currentQuestion] = selectedAnswer;

        setUserAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {

            setCurrentQuestion(currentQuestion + 1);

            setSelectedAnswer(
                newAnswers[currentQuestion + 1] ?? null
            );

            setTimeLeft(30);

        } else {

            setShowResult(true);
        }
    };

    // Back Question
    const handleBack = () => {

        if (currentQuestion > 0) {

            setCurrentQuestion(currentQuestion - 1);

            setSelectedAnswer(
                userAnswers[currentQuestion - 1] ?? null
            );

            setTimeLeft(30);
        }
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

                    Loading Quiz...

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
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-400
                    p-6
                    rounded-2xl
                    text-xl
                    backdrop-blur-lg
                '>

                    {error}

                </div>

            </div>
        );
    }

    // Result
    if (showResult) {

        return (
            <Result
                questions={questions}
                userAnswers={userAnswers}
            />
        );
    }

    const question = questions[currentQuestion];

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

            {/* Quiz Card */}

            <div className='
                relative
                z-10
                w-full
                max-w-3xl
                rounded-3xl
                border
                border-white/10
                bg-white/10
                backdrop-blur-xl
                shadow-2xl
                p-6
                md:p-10
            '>

                {/* Header */}

                <div className='
                    flex
                    justify-between
                    items-center
                    mb-8
                '>

                    <div className='
                        text-cyan-400
                        font-bold
                        text-lg
                    '>

                        Question {currentQuestion + 1}
                        {' '}of{' '}
                        {questions.length}

                    </div>

                    <div className={`
                        px-4
                        py-2
                        rounded-full
                        font-bold
                        text-lg
                        ${
                            timeLeft <= 10
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-cyan-500/20 text-cyan-400'
                        }
                    `}>

                        {timeLeft}s

                    </div>

                </div>

                {/* Question */}

                <h2 className='
                    text-2xl
                    md:text-3xl
                    font-bold
                    text-white
                    leading-relaxed
                    mb-10
                '>

                    {question.question}

                </h2>

                {/* Options */}

                <div className='
                    flex
                    flex-col
                    gap-4
                    mb-10
                '>

                    {question.options.map((option, index) => (

                        <button
                            key={index}
                            onClick={() =>
                                handleAnswerSelect(index)
                            }
                            className={`
                                w-full
                                text-left
                                px-6
                                py-4
                                rounded-2xl
                                border
                                transition-all
                                duration-300
                                font-semibold
                                text-lg

                                ${
                                    selectedAnswer === index
                                        ? `
                                            bg-linear-to-r
                                            from-cyan-500
                                            to-purple-600
                                            text-white
                                            border-transparent
                                            shadow-lg
                                            scale-[1.02]
                                          `
                                        : `
                                            bg-white/5
                                            border-white/10
                                            text-gray-300
                                            hover:bg-white/10
                                            hover:border-cyan-400/30
                                          `
                                }
                            `}
                        >

                            {option}

                        </button>

                    ))}

                </div>

                {/* Actions */}

                <div className='
                    flex
                    justify-between
                    gap-4
                '>

                    {/* Back */}

                    <button
                        onClick={handleBack}
                        disabled={currentQuestion === 0}
                        className='
                            flex-1
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            text-white
                            bg-linear-to-r
                            from-gray-600
                            to-gray-800
                            hover:scale-[1.02]
                            active:scale-95
                            transition-all
                            duration-300
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                        '
                    >

                        Back

                    </button>

                    {/* Next */}

                    <button
                        onClick={handleNext}
                        disabled={
                            selectedAnswer === null ||
                            (
                                currentQuestion ===
                                questions.length - 1 &&
                                isFinishDisabled
                            )
                        }
                        className='
                            flex-1
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
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                        '
                    >

                        {
                            currentQuestion === questions.length - 1
                                ? (
                                    isFinishDisabled
                                        ? 'Submitting...'
                                        : 'Finish'
                                )
                                : 'Next'
                        }

                    </button>

                </div>

            </div>

        </div>
    );
};

export default Quiz;