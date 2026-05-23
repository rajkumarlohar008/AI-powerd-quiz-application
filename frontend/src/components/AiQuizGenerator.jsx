import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const AiQuizGenerator = () => {

    const [text, setText] = useState('');
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);

    const [quiz, setQuiz] = useState(null);

    const [userAnswers, setUserAnswers] = useState([]);

    const [showSummary, setShowSummary] = useState(false);

    const [summary, setSummary] = useState(null);

    const [error, setError] = useState('');

    const [currentQuestion, setCurrentQuestion] = useState(0);

    const navigate = useNavigate();

    // Generate AI Quiz
    const handleGenerate = async (e) => {

        e.preventDefault();

        setLoading(true);

        setError('');

        setQuiz(null);

        setUserAnswers([]);

        setShowSummary(false);

        setSummary(null);

        try {

            const formData = new FormData();

            if (text.trim()) {

                formData.append('text', text);
            }

            if (file) {

                formData.append('file', file);
            }

            const res = await axios.post(
                `${API_URL}/api/ai/generate-quiz`,
                formData,
                {
                    timeout: 80000,
                    headers: {
                        Accept: 'application/json',
                    }
                }
            );

            setQuiz(res.data);

            setUserAnswers(
                new Array(
                    res.data.questions.length
                ).fill(null)
            );

            setCurrentQuestion(0);

        } catch (err) {

            const message =
                err.response?.data?.message
                || (
                    err.code === 'ERR_NETWORK'
                        ? 'Network error or AI generation timeout.'
                        : err.message
                )
                || 'Failed to generate quiz.';

            setError(message);

        } finally {

            setLoading(false);
        }
    };

    // Select Answer
    const handleAnswerSelect = (index) => {

        const updated = [...userAnswers];

        updated[currentQuestion] = index;

        setUserAnswers(updated);
    };

    // Next Question
    const handleNext = () => {

        if (!quiz) return;

        if (
            currentQuestion <
            quiz.questions.length - 1
        ) {

            setCurrentQuestion(
                currentQuestion + 1
            );

        } else {

            handleSubmitAnswers();
        }
    };

    // Back Question
    const handleBack = () => {

        if (currentQuestion > 0) {

            setCurrentQuestion(
                currentQuestion - 1
            );
        }
    };

    // Submit Answers
    const handleSubmitAnswers = async () => {

        if (!quiz) return;

        setLoading(true);

        setError('');

        try {

            const res = await axios.post(
                `${API_URL}/api/ai/quiz-summary`,
                {
                    questions: quiz.questions,
                    userAnswers,
                }
            );

            setSummary(res.data);

            setShowSummary(true);

            // Save Attempt
            const user = JSON.parse(
                localStorage.getItem('user') || '{}'
            );

            if (
                user.id &&
                quiz.questions?.length
            ) {

                const total =
                    quiz.questions.length;

                const correct =
                    quiz.questions.filter(
                        (q, i) =>
                            userAnswers[i] ===
                            q.answerIndex
                    ).length;

                const percentage =
                    total > 0
                        ? Math.round(
                            (correct / total) * 100
                          )
                        : 0;

                const payload = {

                    userId: user.id,

                    quizType: 'AI',

                    correct,

                    total,

                    percentage,

                    questions:
                        quiz.questions.map(
                            (q, index) => ({

                                question:
                                    q.question,

                                options:
                                    q.options,

                                correctAnswer:
                                    q.answerIndex,

                                userAnswer:
                                    userAnswers[index]
                                    ?? null,

                                explanation:
                                    q.explanation
                                    || null,

                                topic:
                                    q.topic
                                    || null,
                            })
                        ),
                };

                axios.post(
                    `${API_URL}/api/quiz-attempts`,
                    payload
                ).catch(() => { });
            }

        } catch (err) {

            setError(
                'Failed to generate quiz summary.'
            );

        } finally {

            setLoading(false);
        }
    };

    // Retake Quiz
    const handleRetake = () => {

        setQuiz(null);

        setUserAnswers([]);

        setShowSummary(false);

        setSummary(null);

        setText('');

        setFile(null);

        setCurrentQuestion(0);
    };

    // Dashboard
    const handleDashboard = () => {

        navigate('/dashboard');
    };

    const current =
        quiz &&
        quiz.questions[currentQuestion];

    // File Upload Button
    useEffect(() => {

        const btn =
            document.querySelector('#inputbtn');

        const input =
            document.querySelector('#fileinput');

        if (!btn || !input) return;

        const handleBtnClick = () => {

            input.click();
        };

        const handleInputChange = (e) => {

            if (
                e.target.files &&
                e.target.files[0]
            ) {

                btn.textContent =
                    e.target.files[0].name;
            }
        };

        btn.addEventListener(
            'click',
            handleBtnClick
        );

        input.addEventListener(
            'change',
            handleInputChange
        );

        return () => {

            btn.removeEventListener(
                'click',
                handleBtnClick
            );

            input.removeEventListener(
                'change',
                handleInputChange
            );
        };

    }, []);

    // INITIAL SCREEN
    if (!quiz && !showSummary) {

        return (

            <div className='
                relative
                min-h-screen
                overflow-hidden
                flex
                items-center
                justify-center
                bg-gradient-to-br
                from-black
                via-slate-900
                to-purple-950
                px-4
                py-10
            '>

                {/* Glow Effects */}

                <div className='
                    absolute
                    top-[-120px]
                    left-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-cyan-500/20
                    rounded-full
                    blur-3xl
                ' />

                <div className='
                    absolute
                    bottom-[-120px]
                    right-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-purple-500/20
                    rounded-full
                    blur-3xl
                ' />

                {/* Card */}

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

                    <h1 className='
                        text-4xl
                        md:text-5xl
                        font-extrabold
                        text-center
                        mb-10
                        bg-gradient-to-r
                        from-cyan-400
                        via-blue-500
                        to-purple-500
                        bg-clip-text
                        text-transparent
                    '>

                        AI Quiz Generator

                    </h1>

                    <form
                        onSubmit={handleGenerate}
                        className='space-y-8'
                    >

                        {/* Text Input */}

                        <div>

                            <label className='
                                block
                                text-xl
                                font-bold
                                text-white
                                mb-4
                            '>

                                Paste Study Material

                            </label>

                            <textarea
                                value={text}
                                onChange={(e) =>
                                    setText(
                                        e.target.value
                                    )
                                }
                                rows={7}
                                placeholder='Paste your notes here...'
                                className='
                                    w-full
                                    rounded-2xl
                                    bg-white/5
                                    border
                                    border-white/10
                                    p-5
                                    text-white
                                    placeholder-gray-400
                                    outline-none
                                    resize-none
                                    focus:border-cyan-400
                                    focus:ring-2
                                    focus:ring-cyan-400/30
                                '
                            />

                        </div>

                        {/* Upload */}

                        <div>

                            <label className='
                                block
                                text-xl
                                font-bold
                                text-white
                                mb-4
                            '>

                                Upload PDF / TXT File

                            </label>

                            <input
                                id='fileinput'
                                type='file'
                                accept='application/pdf,text/plain'
                                onChange={(e) =>
                                    setFile(
                                        e.target.files[0]
                                        || null
                                    )
                                }
                                className='hidden'
                            />

                            <button
                                id='inputbtn'
                                type='button'
                                className='
                                    w-full
                                    py-4
                                    rounded-2xl
                                    border
                                    border-dashed
                                    border-cyan-400/40
                                    bg-white/5
                                    text-gray-300
                                    hover:bg-white/10
                                    transition-all
                                    duration-300
                                '
                            >

                                Upload File

                            </button>

                        </div>

                        {/* Error */}

                        {error && (

                            <div className='
                                bg-red-500/10
                                border
                                border-red-500/20
                                text-red-400
                                rounded-2xl
                                p-4
                            '>

                                {error}

                            </div>

                        )}

                        {/* Generate Button */}

                        <button
                            type='submit'
                            disabled={loading}
                            className='
                                w-full
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-gradient-to-r
                                from-cyan-500
                                to-purple-600
                                hover:scale-[1.02]
                                active:scale-95
                                transition-all
                                duration-300
                                shadow-lg
                                hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                                disabled:opacity-50
                            '
                        >

                            {
                                loading
                                    ? 'Generating...'
                                    : 'Generate AI Quiz'
                            }

                        </button>

                    </form>

                </div>

            </div>
        );
    }

    // QUIZ SCREEN
    if (quiz && !showSummary && current) {

        return (

            <div className='
                relative
                min-h-screen
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

                <div className='
                    absolute
                    top-[-120px]
                    left-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-cyan-500/20
                    rounded-full
                    blur-3xl
                ' />

                <div className='
                    absolute
                    bottom-[-120px]
                    right-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-purple-500/20
                    rounded-full
                    blur-3xl
                ' />

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
                        mb-10
                    '>

                        <h2 className='
                            text-cyan-400
                            text-xl
                            font-bold
                        '>

                            Question
                            {' '}
                            {currentQuestion + 1}
                            {' '}
                            of
                            {' '}
                            {quiz.questions.length}

                        </h2>

                    </div>

                    {/* Question */}

                    <h1 className='
                        text-3xl
                        font-bold
                        text-white
                        mb-10
                        leading-relaxed
                    '>

                        {current.question}

                    </h1>

                    {/* Options */}

                    <div className='
                        flex
                        flex-col
                        gap-4
                        mb-10
                    '>

                        {current.options.map(
                            (opt, idx) => (

                                <button
                                    key={idx}
                                    onClick={() =>
                                        handleAnswerSelect(
                                            idx
                                        )
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
                                            userAnswers[
                                                currentQuestion
                                            ] === idx

                                                ? `
                                                    bg-gradient-to-r
                                                    from-cyan-500
                                                    to-purple-600
                                                    text-white
                                                    border-transparent
                                                    shadow-lg
                                                  `

                                                : `
                                                    bg-white/5
                                                    border-white/10
                                                    text-gray-300
                                                    hover:bg-white/10
                                                  `
                                        }
                                    `}
                                >

                                    {opt}

                                </button>
                            )
                        )}

                    </div>

                    {/* Actions */}

                    <div className='
                        flex
                        gap-5
                    '>

                        <button
                            onClick={handleBack}
                            disabled={
                                currentQuestion === 0
                            }
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-gradient-to-r
                                from-gray-600
                                to-gray-800
                                disabled:opacity-40
                            '
                        >

                            Back

                        </button>

                        <button
                            onClick={handleNext}
                            disabled={
                                userAnswers[
                                    currentQuestion
                                ] === null
                            }
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-gradient-to-r
                                from-cyan-500
                                to-purple-600
                                hover:scale-[1.02]
                                active:scale-95
                                transition-all
                                duration-300
                                disabled:opacity-40
                            '
                        >

                            {
                                currentQuestion ===
                                quiz.questions.length - 1

                                    ? 'Finish'

                                    : 'Next'
                            }

                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // SUMMARY SCREEN
    if (quiz && showSummary && summary) {

        const total = quiz.questions.length;

        const correct =
            quiz.questions.reduce(
                (acc, q, idx) =>
                    (
                        userAnswers[idx] ===
                        q.answerIndex
                    )
                        ? acc + 1
                        : acc,
                0
            );

        const incorrect = total - correct;

        const percentage =
            total > 0
                ? Math.round(
                    (correct / total) * 100
                  )
                : 0;

        return (

            <div className='
                relative
                min-h-screen
                overflow-hidden
                bg-gradient-to-br
                from-black
                via-slate-900
                to-purple-950
                flex
                items-center
                justify-center
                px-4
                py-10
            '>

                <div className='
                    absolute
                    top-[-120px]
                    left-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-cyan-500/20
                    rounded-full
                    blur-3xl
                ' />

                <div className='
                    absolute
                    bottom-[-120px]
                    right-[-120px]
                    w-[350px]
                    h-[350px]
                    bg-purple-500/20
                    rounded-full
                    blur-3xl
                ' />

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
                            text-5xl
                            font-extrabold
                            bg-gradient-to-r
                            from-cyan-400
                            via-blue-500
                            to-purple-500
                            bg-clip-text
                            text-transparent
                            mb-5
                        '>

                            AI Quiz Summary 🎓

                        </h1>

                    </div>

                    {/* Score */}

                    <div className='
                        flex
                        justify-center
                        mb-12
                    '>

                        <div className='
                            w-44
                            h-44
                            rounded-full
                            bg-gradient-to-r
                            from-cyan-500
                            to-purple-600
                            flex
                            flex-col
                            items-center
                            justify-center
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

                    {/* Stats */}

                    <div className='
                        grid
                        grid-cols-1
                        md:grid-cols-3
                        gap-5
                        mb-10
                    '>

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

                                {correct}

                            </h3>

                            <p className='text-gray-300'>

                                Correct

                            </p>

                        </div>

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

                                {incorrect}

                            </h3>

                            <p className='text-gray-300'>

                                Incorrect

                            </p>

                        </div>

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

                                {total}

                            </h3>

                            <p className='text-gray-300'>

                                Total

                            </p>

                        </div>

                    </div>

                    {/* Overall Summary */}

                    {

                        summary.overallSummary && (

                            <div className='
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                p-6
                                mb-8
                            '>

                                <h2 className='
                                    text-2xl
                                    font-bold
                                    text-white
                                    mb-4
                                '>

                                    Overall Feedback

                                </h2>

                                <p className='
                                    text-gray-300
                                    leading-relaxed
                                '>

                                    {
                                        summary.overallSummary
                                    }

                                </p>

                            </div>

                        )

                    }

                    {/* Recommendations */}

                    {

                        summary.recommendations && (

                            <div className='
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                p-6
                                mb-10
                            '>

                                <h2 className='
                                    text-2xl
                                    font-bold
                                    text-white
                                    mb-4
                                '>

                                    Recommendations

                                </h2>

                                <ul className='
                                    list-disc
                                    list-inside
                                    text-gray-300
                                    space-y-3
                                '>

                                    {

                                        summary.recommendations.map(
                                            (r, idx) => (

                                                <li key={idx}>

                                                    {r}

                                                </li>
                                            )
                                        )

                                    }

                                </ul>

                            </div>

                        )

                    }

                    {/* Buttons */}

                    <div className='
                        flex
                        flex-col
                        md:flex-row
                        gap-5
                    '>

                        <button
                            onClick={handleRetake}
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-gradient-to-r
                                from-cyan-500
                                to-blue-600
                            '
                        >

                            Retake AI Quiz

                        </button>

                        <button
                            onClick={handleDashboard}
                            className='
                                flex-1
                                py-4
                                rounded-2xl
                                font-bold
                                text-lg
                                text-white
                                bg-gradient-to-r
                                from-purple-500
                                to-pink-600
                            '
                        >

                            Back to Dashboard

                        </button>

                    </div>

                </div>

            </div>
        );
    }

    return null;
};

export default AiQuizGenerator;