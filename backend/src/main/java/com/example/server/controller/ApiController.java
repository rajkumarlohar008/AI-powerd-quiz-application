package com.example.server.controller;

import com.example.server.dto.*;
import com.example.server.model.QuestionAttempt;
import com.example.server.model.QuizAttempt;
import com.example.server.model.Room;
import com.example.server.model.User;
import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.GeminiService;
import com.example.server.quiz.QuizQuestion;
import com.example.server.quiz.QuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.UserRepository;
import com.example.server.security.EmailService;
import com.example.server.security.JwtService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.swing.text.html.Option;
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

    private final JwtService jwtService;
    private final GeminiService geminiService;
    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;

    public ApiController(UserRepository userRepository,
                         QuizAttemptRepository quizAttemptRepository,
                         JwtService jwtService,
                         GeminiService geminiService) {
        this.userRepository = userRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.jwtService = jwtService;
        this.geminiService = geminiService;
    }

    @GetMapping("/helth")
    public String helth(){
        return "ok";
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if(userRepository.existsByEmail(request.getEmail())) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Email Already Exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        user.setVerified(false);

        String token = UUID.randomUUID().toString();

        user.setVerificationToken(token);

        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), token);

        if(user.getRole().equals("admin")) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Verification Email Sent");
            return ResponseEntity.status(HttpStatus.OK).body(body);
        }
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Registered Successfully");
        return ResponseEntity.status(HttpStatus.OK).body(body);
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
        if (!matches || Objects.equals(user.getRole(), "admin") && !user.isVerified()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        LoginResponse response = new LoginResponse(
                "Login successful",
                token,
                new UserInfo(user.getId(), user.getName(), user.getEmail(),user.getRole())
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam String token) {

        User user = userRepository.findByVerificationToken(token);

        if(user == null) {
            return ResponseEntity.badRequest()
                    .body("Invalid verification link.");
        }

        user.setVerified(true);
        user.setVerificationToken(null);

        userRepository.save(user);

        return ResponseEntity.ok("Email verified successfully!");
    }

    @GetMapping("/quiz")
    public ResponseEntity<QuizResponse> getQuiz() {
        List<QuizQuestion> allQuestions = createAllQuestions();
        Collections.shuffle(allQuestions);
        List<QuizQuestion> selected = allQuestions.subList(0, Math.min(5, allQuestions.size()));
        QuizResponse response = new QuizResponse(selected);
        return ResponseEntity.ok(response);
    }

    @Transactional
    @PostMapping("/room")
    public ResponseEntity<?> createRoom(@Valid @RequestBody Room request, @RequestParam("email") String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email is required."));
        }

        // 1. Safely handle the Optional and return a 444/404 if user doesn't exist
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userOpt.get();

        // 2. Save the new room
        Room savedRoom = roomRepository.save(request);

        // 3. Properly update the relationship
        if(user.getRooms()!=null){
            user.getRooms().add(savedRoom);
        }else{
            user.setRooms(Arrays.asList(savedRoom));
        }
        userRepository.save(user); // Save the user to persist the relationship change

        return ResponseEntity.ok(savedRoom);
    }

    @GetMapping("/getRoom/id")
    public ResponseEntity<?> getRoomById(@RequestParam("roomId") String id){
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        Optional<Room> room = roomRepository.findById(id);
        return ResponseEntity.ok(room.get());
    }

    @GetMapping("/room/all")
    public ResponseEntity<?> getAllRooms(@RequestParam("email") String id){
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User ID is required."));
        }

        Optional<User> userInfo = userRepository.findByEmail(id);
        User user = userInfo.get();
        return ResponseEntity.ok(user.getRooms());
    }

    @Transactional
    @PostMapping("/quizRoom/quiz-attempt") // Don't forget your mapping annotation if it's missing!
    public ResponseEntity<?> saveRoomQuizAttempt(@RequestParam("roomId") String id, @RequestBody RoomResponseRequest request) {
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User ID is required."));
        }

        if (userRepository.findById(request.getUserId()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User not found."));
        }

        // 1. Safely handle the Room Optional first
        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }
        Room room = roomOpt.get(); // Extract the raw Room object

        // 2. Add the request directly to the room's response list
        if(room.getUserResponse()!=null){
            room.getUserResponse().add(request);
        }else{
            room.setUserResponse(List.of(request));
        }

        // 3. Save the unwrapped raw room object, not the Optional box
        Room savedRoom = roomRepository.save(room);

        return ResponseEntity.ok(request);
    }

    @GetMapping("/room/{id}/responses")
    public ResponseEntity<?> getSortedResponses(@PathVariable("id") String id) {
        Optional<Room> roomOpt = roomRepository.findById(id);

        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();
        if (room.getUserResponse() != null) {
            List<RoomResponseRequest> sortedResponses = room.getUserResponse()
                    .stream()
                    .sorted(
                            // 1. Sort by percentage descending
                            Comparator.comparingDouble(RoomResponseRequest::getPercentage).reversed()
                                    // 2. If percentages are equal, sort by timeTaken ascending (nulls placed at the end)
                                    .thenComparing(RoomResponseRequest::getTimeTaken, Comparator.nullsLast(Comparator.naturalOrder()))
                    )
                    .toList();

            return ResponseEntity.ok(sortedResponses);
        } else {
            return ResponseEntity.ok(new ArrayList<RoomResponseRequest>());
        }
    }

    @Transactional
    @DeleteMapping("/room/delete")
    public ResponseEntity<?> deleteRoom(@RequestParam("roomId") String id, @RequestParam("email") String email) {

        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Room ID is required."));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is required."));
        }

        try {
            Optional<User> userInfo = userRepository.findByEmail(email);

            // Safe check if user actually exists
            if (userInfo.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found with provided email."));
            }

            User user = userInfo.get();

            // FIX: Use .equals() for String comparison instead of ==
            user.getRooms().removeIf(room -> room.getId().equals(id));

            // Save the updated user (with the room removed from their list)
            userRepository.save(user);

            // Delete the room entity entirely from the database
            roomRepository.deleteById(id);

            return ResponseEntity.status(HttpStatus.OK)
                    .body(Map.of("message", "Room Deleted.", "user", user));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to delete room: " + e.getMessage()));
        }
    }

    @DeleteMapping("/room/response/delete")
    public ResponseEntity<?> deleteRoomResponse(
            @RequestParam("index") int index,
            @RequestParam("id") String id) {

        Optional<Room> roomOpt = roomRepository.findById(id);

        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();

        if (room.getUserResponse() == null || room.getUserResponse().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No responses found."));
        }

        List<RoomResponseRequest> sortedResponses = new ArrayList<>(
                room.getUserResponse()
                        .stream()
                        .sorted(
                                Comparator.comparingDouble(RoomResponseRequest::getPercentage)
                                        .reversed()
                                        .thenComparing(
                                                RoomResponseRequest::getTimeTaken,
                                                Comparator.nullsLast(Comparator.naturalOrder())
                                        )
                        )
                        .toList()
        );

        if (index < 0 || index >= sortedResponses.size()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid index."));
        }

        sortedResponses.remove(index);

        // Replace old list with new list
        room.setUserResponse(sortedResponses);

        // Save updated room
        roomRepository.save(room);

        return ResponseEntity.ok(Map.of(
                "message", "Deleted successfully",
                "remainingResponses", sortedResponses
        ));
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
        double averagePercentage = 0;
        if (!attempts.isEmpty()) {
            double sum = attempts.stream().mapToDouble(QuizAttempt::getPercentage).sum();
            averagePercentage = Math.round(sum / attempts.size() * 100.0) / 100.0;
        }

        QuizHistoryResponse response = new QuizHistoryResponse(attempts, attempts.size(), averagePercentage);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/history/delete")
    public ResponseEntity<?> deleteQuizHistory(@RequestParam("Id") String id){
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Room ID is required."));
        }
        quizAttemptRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("massage","History deleted !"));
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

