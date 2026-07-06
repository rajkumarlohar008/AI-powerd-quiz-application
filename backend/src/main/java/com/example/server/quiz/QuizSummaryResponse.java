package com.example.server.quiz;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Setter
@Getter
@AllArgsConstructor
public class QuizSummaryResponse {

    private Map<String, TopicStats> perTopic;
    private String overallSummary;
    private List<String> recommendations;

    public static class TopicStats {
        private int correct;
        private int total;

        public TopicStats() {
            // TODO document why this constructor is empty
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
        // TODO document why this constructor is empty
    }


}

