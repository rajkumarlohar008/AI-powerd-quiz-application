package com.example.server.quiz;

import java.util.List;

public class AiQuizResponse {

    private List<AiQuizQuestion> questions;

    public AiQuizResponse() {
    }

    public AiQuizResponse(List<AiQuizQuestion> questions) {
        this.questions = questions;
    }

    public List<AiQuizQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<AiQuizQuestion> questions) {
        this.questions = questions;
    }
}

