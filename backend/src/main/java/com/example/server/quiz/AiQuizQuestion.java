package com.example.server.quiz;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class AiQuizQuestion {

    private String question;
    private List<String> options;
    private int answerIndex;
    private String topic;
    private String explanation;

    public AiQuizQuestion() {
    }

}

