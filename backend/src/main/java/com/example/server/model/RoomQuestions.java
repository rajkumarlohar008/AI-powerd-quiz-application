package com.example.server.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class RoomQuestions {

    private String question;
    private List<String> options;
    private int correctAnswer;
    private Integer userAnswer;

    public RoomQuestions(int correctAnswer, Integer userAnswer, String question, List<String> options) {
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.question = question;
        this.options = options;
    }

}
