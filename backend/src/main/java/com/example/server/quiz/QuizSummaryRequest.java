package com.example.server.quiz;

import java.util.List;

public class QuizSummaryRequest {

    private List<AiQuizQuestion> questions;
    private List<Integer> userAnswers;

    public QuizSummaryRequest() {
    }

    public List<AiQuizQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<AiQuizQuestion> questions) {
        this.questions = questions;
    }

    public List<Integer> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(List<Integer> userAnswers) {
        this.userAnswers = userAnswers;
    }
}

