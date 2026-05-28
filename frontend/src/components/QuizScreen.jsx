import React from 'react';
import Nav from './Nav';

const QuizScreen = ({
    currentQuestion,
    totalQuestions,
    questionData,
    selectedAnswer,
    onSelectAnswer,
    onNext,
    onBack,
    isNextDisabled,
    isBackDisabled,
    nextText,
    title,
    timeLeft
}) => {
    return (
        <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 pt-28 pb-10'>
            {/* Glow */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />

            {/* Header */}
            <Nav />
            
            {/* Quiz Card */}
            <div className='relative z-10 flex justify-center'>
                <div className='w-full max-w-4xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10'>
                    
                    {/* Top */}
                    <div className='flex justify-between items-center mb-10 gap-4'>
                        <h2 className='text-cyan-400 text-xl font-bold tracking-wide drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]'>
                            Question {currentQuestion + 1} of {totalQuestions}
                        </h2>

                        {/* Optional Title (For Room Quiz) */}
                        {title && (
                            <div className='text-purple-400 font-semibold  text-center'>
                                {questionData.topic || title}
                            </div>
                        )}

                        {/* Optional Timer (For Standard Quiz) */}
                        {timeLeft !== undefined && (
                            <div className={`px-4 py-2 rounded-full font-bold text-lg border transition-all duration-300 ${
                                timeLeft <= 10
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            }`}>
                                {timeLeft}s
                            </div>
                        )}
                    </div>

                    {/* Question */}
                    <h1 className='text-2xl md:text-3xl font-bold text-white mb-10 leading-relaxed'>
                        {questionData?.question}
                    </h1>

                    {/* Options */}
                    <div className='flex flex-col gap-4 mb-10'>
                        {questionData?.options?.map((opt, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectAnswer(index)}
                                className={`w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300 font-semibold text-lg ${
                                    selectedAnswer === index
                                        ? 'bg-linear-to-r from-cyan-500 to-purple-600 text-white border-transparent shadow-[0_0_25px_rgba(168,85,247,0.4)] scale-[1.02]'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-cyan-400/40 hover:text-white hover:scale-[1.01]'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className='flex justify-between gap-5'>
                        <button
                            onClick={onBack}
                            disabled={isBackDisabled}
                            className='flex-1  text-lg text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-20 disabled:scale-100 disabled:hover:bg-white/5 disabled:hover:text-gray-300 disabled:cursor-not-allowed
                            
                            px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold  text-center '
                        >
                            Back
                        </button>

                        <button
                            onClick={onNext}
                            disabled={isNextDisabled}
                            className='flex-1  text-lg  hover:border-blue-400/40  duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed
                            
                            px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                        >
                            {nextText}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuizScreen;