package com.example.server.controller;

import com.example.server.dto.*;
import com.example.server.model.QuestionAttempt;
import com.example.server.model.QuizAttempt;
import com.example.server.model.User;
import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.GeminiService;
import com.example.server.quiz.QuizQuestion;
import com.example.server.quiz.QuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.UserRepository;
import com.example.server.security.JwtService;
import jakarta.validation.Valid;
import org.apache.logging.log4j.Level;
import org.apache.logging.slf4j.SLF4JLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")

public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);
    private final UserRepository userRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GeminiService geminiService;

    public ApiController(UserRepository userRepository,
                         QuizAttemptRepository quizAttemptRepository,
                         BCryptPasswordEncoder passwordEncoder,
                         JwtService jwtService,
                         GeminiService geminiService) {
        this.userRepository = userRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.geminiService = geminiService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User newUser = new User(request.getName(), request.getEmail(), hashedPassword);
        User saved = userRepository.save(newUser);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "User registered successfully");
        body.put("userId", saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        User user = userOpt.get();
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!matches) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        LoginResponse response = new LoginResponse(
                "Login successful",
                token,
                new UserInfo(user.getId(), user.getName(), user.getEmail())
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/quiz")
    public ResponseEntity<QuizResponse> getQuiz() {
        List<QuizQuestion> allQuestions = createAllQuestions();
        Collections.shuffle(allQuestions);
        List<QuizQuestion> selected = allQuestions.subList(0, Math.min(5, allQuestions.size()));
        QuizResponse response = new QuizResponse(selected);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/ai/generate-quiz", consumes = {"multipart/form-data"})
    public ResponseEntity<?> generateAiQuiz(@RequestPart(value = "text", required = false) String text,
                                            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            String userText = text != null ? text : "";
            String fileText = file != null ? geminiService.extractTextFromFile(file) : "";
            String combined = (userText + "\n" + fileText).trim();

            if (combined.isEmpty()) {
                Map<String, Object> body = new HashMap<>();
                body.put("message", "No content provided.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
            }

            AiQuizResponse quiz = geminiService.generateQuiz(combined);
            return ResponseEntity.ok(quiz);
        } catch (IOException | InterruptedException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Failed to generate AI quiz.");
            body.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        }
    }

    @PostMapping("/ai/quiz-summary")
    public ResponseEntity<?> aiQuizSummary(@RequestBody QuizSummaryRequest request) {
        try {
            QuizSummaryResponse summary = geminiService.generateSummary(request);
            return ResponseEntity.ok(summary);
        } catch (IOException | InterruptedException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Failed to generate AI quiz summary.");
            body.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
        }
    }

    @PostMapping("/quiz-attempts")
    public ResponseEntity<?> saveQuizAttempt(@RequestBody SaveQuizAttemptRequest request) {
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
        quizAttemptRepository.save(attempt);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Quiz attempt saved.");
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/quiz-history")
    public ResponseEntity<?> getQuizHistory(@RequestParam("userId") String userId) {
        if (userId == null || userId.isBlank()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User ID is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<QuizAttemptItem> items = attempts.stream()
                .map(a -> new QuizAttemptItem(
                        a.getId(),
                        a.getQuizType(),
                        a.getCorrect(),
                        a.getTotal(),
                        a.getPercentage(),
                        a.getCreatedAt()
                ))
                .collect(Collectors.toList());

        double averagePercentage = 0;
        if (!attempts.isEmpty()) {
            double sum = attempts.stream().mapToDouble(QuizAttempt::getPercentage).sum();
            averagePercentage = Math.round(sum / attempts.size() * 100.0) / 100.0;
        }

        QuizHistoryResponse response = new QuizHistoryResponse(items, attempts.size(), averagePercentage);
        return ResponseEntity.ok(response);
    }

    private List<QuizQuestion> createAllQuestions() {
        List<QuizQuestion> questions = new ArrayList<>();



        questions.add(new QuizQuestion(
                1,
                "What does HTML stand for?",
                Arrays.asList(
                        "Hyper Text Markup Language",
                        "High Tech Modern Language",
                        "Home Tool Markup Language",
                        "Hyperlinks and Text Markup Language"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                2,
                "Which programming language is known as the 'language of the web'?",
                Arrays.asList("Python", "JavaScript", "Java", "C++"),
                1
        ));

        questions.add(new QuizQuestion(
                3,
                "What does CSS stand for?",
                Arrays.asList(
                        "Computer Style Sheets",
                        "Creative Style Sheets",
                        "Cascading Style Sheets",
                        "Colorful Style Sheets"
                ),
                2
        ));

        questions.add(new QuizQuestion(
                4,
                "Which company developed React?",
                Arrays.asList("Google", "Microsoft", "Facebook", "Amazon"),
                2
        ));

        questions.add(new QuizQuestion(
                5,
                "What is the purpose of Node.js?",
                Arrays.asList(
                        "To style web pages",
                        "To run JavaScript on the server",
                        "To create databases",
                        "To design graphics"
                ),
                1
        ));

        questions.add(new QuizQuestion(
                6,
                "Which of the following is NOT a JavaScript framework?",
                Arrays.asList("Angular", "Vue.js", "Django", "React"),
                2
        ));

        questions.add(new QuizQuestion(
                7,
                "What does API stand for?",
                Arrays.asList(
                        "Application Programming Interface",
                        "Advanced Programming Integration",
                        "Application Process Integration",
                        "Advanced Process Interface"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                8,
                "Which database is a NoSQL database?",
                Arrays.asList("MySQL", "PostgreSQL", "MongoDB", "Oracle"),
                2
        ));

        questions.add(new QuizQuestion(
                9,
                "What is the default port for HTTP?",
                Arrays.asList("8080", "443", "80", "3000"),
                2
        ));

        questions.add(new QuizQuestion(
                10,
                "Which method is used to add an element at the end of an array in JavaScript?",
                Arrays.asList("push()", "pop()", "shift()", "unshift()"),
                0
        ));

        questions.add(new QuizQuestion(
                11,
                "What does JSON stand for?",
                Arrays.asList(
                        "JavaScript Object Notation",
                        "Java Standard Object Notation",
                        "JavaScript Oriented Network",
                        "Java Syntax Object Network"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                12,
                "Which HTTP method is used to update data?",
                Arrays.asList("GET", "POST", "PUT", "DELETE"),
                2
        ));

        questions.add(new QuizQuestion(
                13,
                "What is Git?",
                Arrays.asList(
                        "A programming language",
                        "A version control system",
                        "A database",
                        "A web framework"
                ),
                1
        ));

        questions.add(new QuizQuestion(
                14,
                "Which symbol is used for comments in JavaScript?",
                Arrays.asList("/* */", "//", "Both A and B", "# "),
                2
        ));

        questions.add(new QuizQuestion(
                15,
                "What does SQL stand for?",
                Arrays.asList(
                        "Structured Query Language",
                        "Simple Query Language",
                        "Standard Question Language",
                        "System Query Language"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                16,
                "Which company developed MongoDB?",
                Arrays.asList("Oracle", "MongoDB Inc.", "Microsoft", "IBM"),
                1
        ));

        questions.add(new QuizQuestion(
                17,
                "What is the purpose of 'npm' in Node.js?",
                Arrays.asList(
                        "Node Package Manager",
                        "New Programming Method",
                        "Network Protocol Manager",
                        "Node Process Monitor"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                18,
                "Which of these is a CSS framework?",
                Arrays.asList("React", "Bootstrap", "Django", "Express"),
                1
        ));

        questions.add(new QuizQuestion(
                19,
                "What does DOM stand for?",
                Arrays.asList(
                        "Document Object Model",
                        "Data Object Management",
                        "Digital Oriented Method",
                        "Document Oriented Model"
                ),
                0
        ));

        questions.add(new QuizQuestion(
                20,
                "Which keyword is used to declare a constant in JavaScript?",
                Arrays.asList("var", "let", "const", "constant"),
                2
        ));

        return questions;
    }
}

