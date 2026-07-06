import React, { useState } from 'react';
import { Undo2, Users, FileChartPie } from 'lucide-react';

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
    timeLeft,
    role,
    onGenerateRoom,
    onGeneratePreset,
    onUniversalBack
}) => {

    const [isPopedUp, setPopedUp] = useState(false);

    let handleCreateRoom = () => {
        setPopedUp(true);
        if (questionData && questionData.questions) {
            const newQuestions = questionData.questions.map(({ question, options, answerIndex }) => ({
                question,
                options,
                correctAnswer: answerIndex
            }));
            console.log(newQuestions);
        }
    }

    return (
        <div className='relative min-h-screen overflow-y-auto bg-linear-to-br from-black via-slate-900 to-purple-950 px-4 pt-28 pb-10'>
            {/* Glow */}
            <div className='absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-cyan-500/20 rounded-full blur-3xl' />
            <div className='absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-purple-500/20 rounded-full blur-3xl' />


            <div className='relative z-10 w-full max-w-3xl mx-auto rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-6 md:p-10 text-white'>

                {/* Header Section */}
                <div className='flex items-center justify-between border-b border-white/5 pb-5 mb-6 gap-3'>
                    <div className='flex flex-col gap-1'>
                        <h2 className='text-xs font-semibold text-cyan-400 uppercase tracking-wider'>
                            {title || 'AI Generated Quiz'}
                        </h2>
                        <h1 className='text-xl md:text-2xl font-bold text-white'>
                            Question {currentQuestion + 1} <span className='text-gray-400 font-normal'>/ {totalQuestions}</span>
                        </h1>
                    </div>

                    <div className='flex items-center gap-4'>
                        {role === 'admin' && (
                            <div className='flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5'>
                                <Users
                                    onClick={onGenerateRoom}
                                    className='w-5 h-5 text-gray-400 hover:text-cyan-400 transition-colors duration-200 cursor-pointer'
                                />
                                <FileChartPie
                                    onClick={onGeneratePreset}
                                    className='w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors duration-200 cursor-pointer'
                                />
                            </div>
                        )}
                        <Undo2
                            onClick={onUniversalBack}
                            className='w-6 h-6 text-gray-400 hover:text-white transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95'
                        />
                    </div>
                </div>

                {/* Progress Bar & Timer */}
                <div className='space-y-4 mb-8'>
                    <div className='w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5'>
                        <div
                            className='bg-linear-to-r from-cyan-400 to-purple-500 h-full transition-all duration-500'
                            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>

                    <div className='flex justify-between items-center text-xs font-semibold tracking-wider uppercase text-gray-400'>
                        <span>Progress: {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
                        <span className={`${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                            Time Remaining: {timeLeft}s
                        </span>
                    </div>
                </div>

                {/* Question Area */}
                <div className='bg-white/5 border border-white/5 rounded-2xl p-6 mb-8 shadow-inner'>
                    <p className='text-lg md:text-xl font-medium leading-relaxed text-gray-100'>
                        {questionData?.question}
                    </p>
                </div>

                {/* Options Layout */}
                <div className='grid grid-cols-1 gap-4 mb-8'>
                    {questionData?.options?.map((option, index) => {
                        const isSelected = selectedAnswer === index;

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    onSelectAnswer(index);
                                }}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] group cursor-pointer flex justify-between items-center ${isSelected
                                    ? 'bg-linear-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                <span className='font-medium text-base md:text-lg leading-snug pr-4'>
                                    {option}
                                </span>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected
                                    ? 'border-cyan-400 bg-cyan-400'
                                    : 'border-gray-500 group-hover:border-gray-400'
                                    }`}>
                                    {isSelected && <div className='w-2.5 h-2.5 rounded-full bg-slate-950' />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Action Controls Footer */}
                <div className='flex flex-row gap-4 border-t border-white/5 pt-6'>
                    <button
                        onClick={onBack}
                        disabled={isBackDisabled}
                        className='flex-1 text-lg text-gray-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-20 disabled:scale-100 disabled:hover:bg-white/5 disabled:hover:text-gray-300 disabled:cursor-not-allowed px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold text-center'
                    >
                        Back
                    </button>

                    <button
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className='flex-1 text-lg hover:border-blue-400/40 duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed px-10 md:px-17 mt-3 w-full py-3.5 rounded-2xl font-bold bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-center text-white'
                    >
                        {nextText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizScreen;