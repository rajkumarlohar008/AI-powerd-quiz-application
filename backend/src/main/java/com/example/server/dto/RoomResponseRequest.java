package com.example.server.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class RoomResponseRequest {
    private String userId;
    private String userName;
    private String quizType;   // PREDEFINED or AI
    private int correct;
    private int total;
    private double percentage;
    private int timeTaken;

    public RoomResponseRequest(String userId, String userName, String quizType, int correct, int total, double percentage, int timeTaken) {
        this.userId = userId;
        this.userName = userName;
        this.quizType = quizType;
        this.correct = correct;
        this.total = total;
        this.percentage = percentage;
        this.timeTaken = timeTaken;
    }

    public RoomResponseRequest() {
    }

}
