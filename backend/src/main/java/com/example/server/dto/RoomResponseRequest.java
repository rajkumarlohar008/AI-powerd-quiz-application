package com.example.server.dto;

public class RoomResponseRequest {
    private String userId;
    private String userName;
    private String quizType;   // PREDEFINED or AI
    private int correct;
    private int total;
    private double percentage;

    public RoomResponseRequest(String userId, String userName, String quizType, int correct, int total, double percentage) {
        this.userId = userId;
        this.userName = userName;
        this.quizType = quizType;
        this.correct = correct;
        this.total = total;
        this.percentage = percentage;
    }

    public RoomResponseRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getQuizType() {
        return quizType;
    }

    public int getCorrect() {
        return correct;
    }

    public int getTotal() {
        return total;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public void setQuizType(String quizType) {
        this.quizType = quizType;
    }

    public void setCorrect(int correct) {
        this.correct = correct;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public double getPercentage() {
        return percentage;
    }
}
