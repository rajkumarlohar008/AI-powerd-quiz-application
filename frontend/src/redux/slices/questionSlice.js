import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    userAnswers: [],
    showResult: false,
    scoreData: null,
    timeLeft: 30, // Default time per question
    isSubmitting: false,
};

const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        setQuestions: (state, action) => {
            state.questions = action.payload;
            state.currentQuestionIndex = 0;
            state.userAnswers = [];
            state.showResult = false;
            state.selectedAnswer = null;
        },
        setCurrentQuestionIndex: (state, action) => {
            state.currentQuestionIndex = action.payload;
        },
        setSelectedAnswer: (state, action) => {
            state.selectedAnswer = action.payload;
        },
        recordAnswer: (state, action) => {
            state.userAnswers.push(action.payload);
        },
        setShowResult: (state, action) => {
            state.showResult = action.payload;
        },
        setScoreData: (state, action) => {
            state.scoreData = action.payload;
        },
        setTimeLeft: (state, action) => {
            state.timeLeft = action.payload;
        },
        decrementTime: (state) => {
            if (state.timeLeft > 0) {
                state.timeLeft -= 1;
            }
        },
        setIsSubmitting: (state, action) => {
            state.isSubmitting = action.payload;
        },
        resetQuiz: (state) => {
            state.currentQuestionIndex = 0;
            state.selectedAnswer = null;
            state.userAnswers = [];
            state.showResult = false;
            state.scoreData = null;
            state.timeLeft = 30;
            state.isSubmitting = false;
            state.questions = [];
        }
    }
});

export const { 
    setQuestions, 
    setCurrentQuestionIndex, 
    setSelectedAnswer, 
    recordAnswer, 
    setShowResult, 
    setScoreData,
    setTimeLeft,
    decrementTime,
    setIsSubmitting,
    resetQuiz
} = questionSlice.actions;

export default questionSlice.reducer;
