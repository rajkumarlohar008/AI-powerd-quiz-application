package com.example.server.dto;

import java.util.List;

public class QuizHistoryResponse {

    private List<QuizAttemptItem> attempts;
    private long totalAttempts;
    private double averagePercentage;

    public QuizHistoryResponse() {
    }

    public QuizHistoryResponse(List<QuizAttemptItem> attempts, long totalAttempts, double averagePercentage) {
        this.attempts = attempts;
        this.totalAttempts = totalAttempts;
        this.averagePercentage = averagePercentage;
    }

    public List<QuizAttemptItem> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<QuizAttemptItem> attempts) {
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
