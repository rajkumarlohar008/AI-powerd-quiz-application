package com.example.server.controller;

import com.example.server.ai.AIOrchestrator;
import com.example.server.dto.QuizHistoryResponse;
import com.example.server.dto.SaveQuizAttemptRequest;
import com.example.server.model.QuestionAttempt;
import com.example.server.model.QuizAttempt;
import com.example.server.quiz.*;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.UserRepository;
import com.example.server.services.ExtractTextService;
import com.example.server.services.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {

        this.quizService = quizService;
    }

    @PostMapping(value = "/ai/generate-quiz", consumes = {"multipart/form-data"})
    public ResponseEntity<?> generateAiQuiz(@RequestPart(value = "text", required = false) String text, @RequestPart(value = "file", required = false) MultipartFile file) {
        return quizService.getAiQuiz(text,file);
    }

    @PostMapping("/ai/quiz-summary")
    public ResponseEntity<?> aiQuizSummary(@RequestBody QuizSummaryRequest request) {
        return quizService.aiQuizSummary(request);
    }

    @PostMapping("/quiz-attempts")
    public ResponseEntity<?> saveQuizAttempt(@RequestBody SaveQuizAttemptRequest request) {
        return quizService.saveQuizAttempt(request);
    }

    @GetMapping("/quiz-history")
    public ResponseEntity<?> getQuizHistory(@RequestParam("userId") String userId) {
        return quizService.getQuizHistory(userId);
    }

    @DeleteMapping("/history/delete")
    public ResponseEntity<?> deleteQuizHistory(@RequestParam("Id") String id) {
        return quizService.deleteQuizHistory(id);
    }

}
