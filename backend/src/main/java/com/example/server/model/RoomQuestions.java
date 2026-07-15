package com.example.server.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
public class RoomQuestions {

    private String question;
    private List<String> options;
    private int correctAnswer;
    private Integer userAnswer;
    private String explanation;

}
