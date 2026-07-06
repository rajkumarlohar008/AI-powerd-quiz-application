package com.example.server.quiz;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuizQuestion {

    private int id;
    private String question;
    private List<String> options;
    private int correctAnswer;

    public QuizQuestion() {
    }

    public QuizQuestion(int id, String question, List<String> options, int correctAnswer) {
        this.id = id;
        this.question = question;
        this.options = options;
        this.correctAnswer = correctAnswer;
    }

}

