package com.example.server.model;

import java.util.List;

public class RoomQuestions {

    private String question;
    private List<String> options;
    private int correctAnswer;
    private Integer userAnswer;

    public RoomQuestions(int correctAnswer, Integer userAnswer, String question, List<String> options) {
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.question = question;
        this.options = options;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public void setCorrectAnswer(int correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public void setUserAnswer(Integer userAnswer) {
        this.userAnswer = userAnswer;
    }

    public String getQuestion() {
        return question;
    }

    public List<String> getOptions() {
        return options;
    }

    public int getCorrectAnswer() {
        return correctAnswer;
    }

    public Integer getUserAnswer() {
        return userAnswer;
    }
}
