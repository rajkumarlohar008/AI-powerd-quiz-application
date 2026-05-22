package com.example.server.dto;

import com.example.server.model.QuizAttempt;

import java.util.List;

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

    public List<QuizAttempt> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<QuizAttempt> attempts) {
        this.attempts = attempts;
    }

    public long getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(long totalAttempts) {
        this.totalAttempts = totalAttempts;
    }

    public double getAveragePercentage() {
        return averagePercentage;
    }

    public void setAveragePercentage(double averagePercentage) {
        this.averagePercentage = averagePercentage;
    }
}
