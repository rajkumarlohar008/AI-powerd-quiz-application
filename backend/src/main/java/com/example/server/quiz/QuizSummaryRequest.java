package com.example.server.quiz;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuizSummaryRequest {

    private List<AiQuizQuestion> questions;
    private List<Integer> userAnswers;

    public QuizSummaryRequest() {
    }

}

