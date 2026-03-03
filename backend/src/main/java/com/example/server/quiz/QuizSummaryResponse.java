package com.example.server.quiz;

import java.util.List;
import java.util.Map;

public class QuizSummaryResponse {

    private Map<String, TopicStats> perTopic;
    private String overallSummary;
    private List<QuizTopicResult> topics;
    private List<String> recommendations;

    public static class TopicStats {
        private int correct;
        private int total;

        public TopicStats() {
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
    }

    public QuizSummaryResponse() {
    }

    public Map<String, TopicStats> getPerTopic() {
        return perTopic;
    }

    public void setPerTopic(Map<String, TopicStats> perTopic) {
        this.perTopic = perTopic;
    }

    public String getOverallSummary() {
        return overallSummary;
    }

    public void setOverallSummary(String overallSummary) {
        this.overallSummary = overallSummary;
    }

    public List<QuizTopicResult> getTopics() {
        return topics;
    }

    public void setTopics(List<QuizTopicResult> topics) {
        this.topics = topics;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }
}

