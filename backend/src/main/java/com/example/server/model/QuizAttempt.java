package com.example.server.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Setter
@Getter
@Document(collection = "quiz_attempts")
public class QuizAttempt {

    @Id
    private String id;

    @Indexed
    private String userId;
    private String quizType;
    private int correct;
    private int total;
    private double percentage;
    private Instant createdAt;
    private List<QuestionAttempt> questions;

    public QuizAttempt() {
    }

}
