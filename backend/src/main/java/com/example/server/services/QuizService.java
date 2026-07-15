package com.example.server.services;

import com.example.server.ai.AIOrchestrator;
import com.example.server.dto.QuizHistoryResponse;
import com.example.server.dto.SaveQuizAttemptRequest;
import com.example.server.model.QuestionAttempt;
import com.example.server.model.QuizAttempt;
import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final ExtractTextService extractTextService;
    private final AIOrchestrator ai;
    private final UserRepository userRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public QuizService(ExtractTextService extractTextService, AIOrchestrator ai, UserRepository userRepository, QuizAttemptRepository quizAttemptRepository) {
        this.extractTextService = extractTextService;
        this.ai = ai;
        this.userRepository = userRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    public ResponseEntity<?> getAiQuiz(String text, MultipartFile file) {
        try {
            String userText = text != null ? text : "";
            String fileText = file != null ? extractTextService.extractTextFromFile(file) : "";
            String combined = (userText + "\n" + fileText).trim();

            if (combined.isEmpty()) {
                Map<String, Object> body = new HashMap<>();
                body.put("message", "No content provided.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
            }

            AiQuizResponse quiz = ai.generateQuiz(combined);
            return ResponseEntity.ok(quiz);
        } catch (IOException | InterruptedException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Failed to generate AI quiz.");
            body.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public ResponseEntity<?> aiQuizSummary(QuizSummaryRequest request) {
        try {
            QuizSummaryResponse summary = ai.generateSummary(request);
            return ResponseEntity.ok(summary);
        } catch (IOException | InterruptedException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Failed to generate AI quiz summary.");
            body.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public ResponseEntity<?> saveQuizAttempt(SaveQuizAttemptRequest request) {
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User ID is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        if (userRepository.findById(request.getUserId()).isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User not found.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUserId(request.getUserId());
        attempt.setQuizType(request.getQuizType() != null ? request.getQuizType() : "PREDEFINED");
        attempt.setCorrect(request.getCorrect());
        attempt.setTotal(request.getTotal());
        attempt.setPercentage(request.getPercentage());
        attempt.setCreatedAt(Instant.now());
        if (request.getQuestions() != null) {
            List<QuestionAttempt> qs = request.getQuestions().stream().map(dto -> {
                QuestionAttempt q = new QuestionAttempt();
                q.setQuestion(dto.getQuestion());
                q.setOptions(dto.getOptions());
                q.setCorrectAnswer(dto.getCorrectAnswer());
                q.setUserAnswer(dto.getUserAnswer());
                q.setExplanation(dto.getExplanation());
                q.setTopic(dto.getTopic());
                return q;
            }).collect(Collectors.toList());
            attempt.setQuestions(qs);
        }
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Quiz attempt saved.");
        body.put("saved",saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    public ResponseEntity<?> getQuizHistory(String userId) {
        if (userId == null || userId.isBlank()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User ID is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId);
        double averagePercentage = 0;
        if (!attempts.isEmpty()) {
            double sum = attempts.stream().mapToDouble(QuizAttempt::getPercentage).sum();
            averagePercentage = Math.round(sum / attempts.size() * 100.0) / 100.0;
        }

        QuizHistoryResponse response = new QuizHistoryResponse(attempts, attempts.size(), averagePercentage);
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> deleteQuizHistory(String id){
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", " ID is required."));
        }
        quizAttemptRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("massage", "History deleted !"));
    }

}
