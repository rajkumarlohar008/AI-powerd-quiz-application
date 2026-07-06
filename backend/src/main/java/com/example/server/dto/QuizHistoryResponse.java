package com.example.server.dto;

import com.example.server.model.QuizAttempt;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuizHistoryResponse {

    private List<QuizAttempt> attempts;
    private long totalAttempts;
    private double averagePercentage;

    public QuizHistoryResponse() {
    }

    public QuizHistoryResponse(List<QuizAttempt> attempts, long totalAttempts, double averagePercentage) {
        this.attempts = attempts;
        this.totalAttempts = totalAttempts;
        this.averagePercentage = averagePercentage;
    }

}
