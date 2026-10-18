package com.example.server.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class RoomResponseRequest {
    private String userId;
    private String userName;
    private String quizType;
    private int correct;
    private int total;
    private double percentage;
    private int timeTaken;
    private boolean certificateAllowed;
    private List<RoomQuestionAnswer> answers;

    public RoomResponseRequest(String userId, String userName, String quizType, int correct, int total, double percentage, int timeTaken) {
        this.userId = userId;
        this.userName = userName;
        this.quizType = quizType;
        this.correct = correct;
        this.total = total;
        this.percentage = percentage;
        this.timeTaken = timeTaken;
        this.certificateAllowed = false;
    }

    public RoomResponseRequest() {
    }
}
