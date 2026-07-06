package com.example.server.model;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuestionAttempt {


    private String question;
    private List<String> options;
    private int correctAnswer;
    private Integer userAnswer;
    private String explanation;
    private String topic;

    public QuestionAttempt(List<String> options, String id, String question, int correctAnswer, Integer userAnswer, String explanation, String topic) {
        this.options = options;
        this.question = question;
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.explanation = explanation;
        this.topic = topic;
    }

    public QuestionAttempt() {
    }

}
