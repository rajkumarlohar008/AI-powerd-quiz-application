package com.example.server.quiz;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class AiQuizResponse {

    private List<AiQuizQuestion> questions;

    public AiQuizResponse() {
    }

    public AiQuizResponse(List<AiQuizQuestion> questions) {
        this.questions = questions;
    }

}

