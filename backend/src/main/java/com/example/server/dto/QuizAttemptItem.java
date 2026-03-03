package com.example.server.dto;

import java.time.Instant;

public class QuizAttemptItem {

    private String id;
    private String quizType;
    private int correct;
    private int total;
    private double percentage;
    private Instant createdAt;

    public QuizAttemptItem() {
    }

    public QuizAttemptItem(String id, String quizType, int correct, int total, double percentage, Instant createdAt) {
        this.id = id;
        this.quizType = quizType;
        this.correct = correct;
        this.total = total;
        this.percentage = percentage;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuizType() {
        return quizType;
    }

    public void setQuizType(String quizType) {
        this.quizType = quizType;
    }

    public int getCorrect() {
        return correct;
    }

    public void setCorrect(int correct) {
        this.correct = correct;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
