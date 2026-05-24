import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import Nav from './Nav';

const Result = ({ questions, userAnswers }) => {

    const navigate = useNavigate();

    const savedRef = useRef(false);

    // Calculate Score
    const calculateScore = () => {

        let correct = 0;
        let incorrect = 0;

        questions.forEach((question, index) => {

            if (
                userAnswers[index] ===
                question.correctAnswer
            ) {

                correct++;

            } else {

                incorrect++;
            }
        });

        return {
            correct,
            incorrect,
            total: questions.length
        };
    };

    const score = calculateScore();

    const percentage = Math.round(
        (score.correct / score.total) * 100
    );

    // Save Quiz Attempt
    useEffect(() => {

        if (
            savedRef.current ||
            !questions?.length
        ) {
            return;
        }

        const user = JSON.parse(
            localStorage.getItem('user') || '{}'
        );

        if (!user.id) return;

        savedRef.current = true;

        const payload = {

            userId: user.id,

            quizType: 'PREDEFINED',

            correct: score.correct,

            total: score.total,

            percentage,

            questions: questions.map((q, index) => ({

                question: q.question,

                options: q.options,

                correctAnswer: q.correctAnswer,

                userAnswer:
                    userAnswers[index] ?? null,

                explanation: null,

                topic: null,

            })),
        };

        axios.post(
            `${API_URL}/api/quiz-attempts`,
            payload
        ).catch(() => { });

    }, [
        questions,
        userAnswers,
        score.correct,
        score.total,
        percentage
    ]);

    // Retake Quiz
    const handleRetake = () => {
        window.location.reload();
    };

    // Dashboard
    const handleDashboard = () => {
        navigate('/dashboard');
    };

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
            <Nav />

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

                {/* Header */}

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

                        Quiz Completed 🎉

                    </h1>

                    <p className='
                        text-gray-300
                        text-lg
                    '>

                        Great effort! Here is your result.

                    </p>

                </div>

                {/* Percentage */}

                <div className='
                    flex
                    justify-center
                    mb-10
                '>

                    <div className='
                        w-44
                        h-44
                        rounded-full
                        bg-linear-to-r
                        from-cyan-500
                        to-purple-600
                        flex
                        flex-col
                        items-center
                        justify-center
                        shadow-[0_0_40px_rgba(168,85,247,0.6)]
                    '>

                        <h2 className='
                            text-5xl
                            font-extrabold
                            text-white
                        '>

                            {percentage}%

                        </h2>

                        <p className='
                            text-white
                            mt-2
                            font-semibold
                        '>

                            Your Score

                        </p>

                    </div>

                </div>

                {/* Score Breakdown */}

                <div className='
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-5
                    mb-12
                '>

                    {/* Correct */}

                    <div className='
                        rounded-2xl
                        bg-emerald-500/10
                        border
                        border-emerald-500/20
                        p-6
                        text-center
                    '>

                        <h3 className='
                            text-4xl
                            font-bold
                            text-emerald-400
                        '>

                            {score.correct}

                        </h3>

                        <p className='
                            text-gray-300
                            mt-2
                            font-semibold
                        '>

                            Correct

                        </p>

                    </div>

                    {/* Incorrect */}

                    <div className='
                        rounded-2xl
                        bg-red-500/10
                        border
                        border-red-500/20
                        p-6
                        text-center
                    '>

                        <h3 className='
                            text-4xl
                            font-bold
                            text-red-400
                        '>

                            {score.incorrect}

                        </h3>

                        <p className='
                            text-gray-300
                            mt-2
                            font-semibold
                        '>

                            Incorrect

                        </p>

                    </div>

                    {/* Total */}

                    <div className='
                        rounded-2xl
                        bg-cyan-500/10
                        border
                        border-cyan-500/20
                        p-6
                        text-center
                    '>

                        <h3 className='
                            text-4xl
                            font-bold
                            text-cyan-400
                        '>

                            {score.total}

                        </h3>

                        <p className='
                            text-gray-300
                            mt-2
                            font-semibold
                        '>

                            Total

                        </p>

                    </div>

                </div>

                {/* Answers Review */}

                <div className='mb-10'>

                    <h2 className='
                        text-3xl
                        font-bold
                        text-white
                        mb-8
                    '>

                        Review Your Answers

                    </h2>

                    <div className='space-y-6'>

                        {questions.map((question, index) => {

                            const isCorrect =
                                userAnswers[index] ===
                                question.correctAnswer;

                            const userAnswerText =
                                userAnswers[index] !== null &&
                                userAnswers[index] !== undefined
                                    ? question.options[
                                        userAnswers[index]
                                      ]
                                    : 'Not Answered';

                            const correctAnswerText =
                                question.options[
                                    question.correctAnswer
                                ];

                            return (

                                <div
                                    key={index}
                                    className={`
                                        rounded-2xl
                                        border
                                        p-6
                                        backdrop-blur-lg
                                        transition-all
                                        duration-300

                                        ${
                                            isCorrect
                                                ? `
                                                    bg-emerald-500/10
                                                    border-emerald-500/20
                                                  `
                                                : `
                                                    bg-red-500/10
                                                    border-red-500/20
                                                  `
                                        }
                                    `}
                                >

                                    {/* Question */}

                                    <h3 className='
                                        text-xl
                                        font-bold
                                        text-white
                                        mb-4
                                    '>

                                        Q{index + 1}.{' '}
                                        {question.question}

                                    </h3>

                                    {/* User Answer */}

                                    <p className='
                                        text-gray-300
                                        mb-2
                                    '>

                                        <span className='
                                            font-bold
                                            text-cyan-400
                                        '>

                                            Your Answer:

                                        </span>

                                        {' '}
                                        {userAnswerText}

                                    </p>

                                    {/* Correct Answer */}

                                    {!isCorrect && (

                                        <p className='
                                            text-gray-300
                                            mb-2
                                        '>

                                            <span className='
                                                font-bold
                                                text-emerald-400
                                            '>

                                                Correct Answer:

                                            </span>

                                            {' '}
                                            {correctAnswerText}

                                        </p>

                                    )}

                                    {/* Status */}

                                    <div className='mt-4'>

                                        <span className={`
                                            px-4
                                            py-2
                                            rounded-full
                                            text-sm
                                            font-bold

                                            ${
                                                isCorrect
                                                    ? `
                                                        bg-emerald-500/20
                                                        text-emerald-400
                                                      `
                                                    : `
                                                        bg-red-500/20
                                                        text-red-400
                                                      `
                                            }
                                        `}>

                                            {
                                                isCorrect
                                                    ? '✓ Correct'
                                                    : '✗ Incorrect'
                                            }

                                        </span>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </div>

                {/* Actions */}

                <div className='
                    flex
                    flex-col
                    md:flex-row
                    gap-5
                '>

                    {/* Retake */}

                    <button
                        onClick={handleRetake}
                        className='
                            flex-1
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            text-white
                            bg-linear-to-r
                            from-cyan-500
                            to-blue-600
                            hover:scale-[1.02]
                            active:scale-95
                            transition-all
                            duration-300
                            shadow-lg
                            hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]
                        '
                    >

                        Retake Quiz

                    </button>

                    {/* Dashboard */}

                    <button
                        onClick={handleDashboard}
                        className='
                            flex-1
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            text-white
                            bg-linear-to-r
                            from-purple-500
                            to-pink-600
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

export default Result;