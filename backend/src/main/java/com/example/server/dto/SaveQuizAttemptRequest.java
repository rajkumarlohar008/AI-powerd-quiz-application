package com.example.server.dto;

import java.util.List;

public class SaveQuizAttemptRequest {

    private String userId;
    private String quizType;   // PREDEFINED or AI
    private int correct;
    private int total;
    private double percentage;
    private List<QuestionAttemptDto> questions;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public List<QuestionAttemptDto> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionAttemptDto> questions) {
        this.questions = questions;
    }

    public static class QuestionAttemptDto {
        private String question;
        private java.util.List<String> options;
        private int correctAnswer;
        private Integer userAnswer;
        private String explanation;
        private String topic;

        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public java.util.List<String> getOptions() {
            return options;
        }

        public void setOptions(java.util.List<String> options) {
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
}
