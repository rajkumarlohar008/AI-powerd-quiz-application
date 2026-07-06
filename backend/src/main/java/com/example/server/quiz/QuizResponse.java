package com.example.server.quiz;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuizResponse {

    private List<QuizQuestion> questions;

    public QuizResponse() {
    }

    public QuizResponse(List<QuizQuestion> questions) {
        this.questions = questions;
    }

}

