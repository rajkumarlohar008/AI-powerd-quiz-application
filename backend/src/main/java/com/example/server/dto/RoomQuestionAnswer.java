package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RoomQuestionAnswer {
    private String question;
    private List<String> options;
    private Integer correctAnswer;
    private Integer userAnswer;
    private String explanation;
}
