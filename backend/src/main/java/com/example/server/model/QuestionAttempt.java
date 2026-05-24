package com.example.server.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * Stored per-question data for a quiz attempt (for review/history).
 */

public class QuestionAttempt {


    private String question;
    private List<String> options;
    private int correctAnswer;
    private Integer userAnswer;
    private String explanation;
    private String topic;

    public QuestionAttempt(List<String> options, String id, String question, int correctAnswer, Integer userAnswer, String explanation, String topic) {
        this.options = options;
        this.question = question;
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.explanation = explanation;
        this.topic = topic;
    }

    public QuestionAttempt() {
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public int getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(int correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public Integer getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(Integer userAnswer) {
        this.userAnswer = userAnswer;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }
}
