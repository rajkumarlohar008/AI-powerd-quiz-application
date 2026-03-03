package com.example.server.repository;

import com.example.server.model.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {

    List<QuizAttempt> findByUserIdOrderByCreatedAtDesc(String userId);
}
