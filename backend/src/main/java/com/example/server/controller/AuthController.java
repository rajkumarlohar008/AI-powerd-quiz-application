package com.example.server.controller;

import com.example.server.dto.*;
import com.example.server.model.*;
import com.example.server.quiz.GeminiService;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.UserRepository;
import com.example.server.security.EmailService;
import com.example.server.security.JwtService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthController(PasswordEncoder passwordEncoder, EmailService emailService, UserRepository userRepository, QuizAttemptRepository quizAttemptRepository, JwtService jwtService, GeminiService geminiService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @GetMapping("/helth")
    public String helth() {
        return "ok";
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Email Already Exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());


        if (request.getRole().equals("admin")) {
            user.setVerified(false);
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            emailService.sendVerificationEmail(user.getEmail(), token);
        }
        userRepository.save(user);


        if (user.getRole().equals("admin")) {
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
        if (!matches) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        if (Objects.equals(user.getRole(), "admin") && !user.isVerified()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Please Verify Your Email Before Login !!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        LoginResponse response = new LoginResponse("Login successful", token, new UserInfo(user.getId(), user.getName(), user.getEmail(), user.getRole()));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam String token) {

        User user = userRepository.findByVerificationToken(token);

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid verification link.");
        }

        user.setVerified(true);
        user.setVerificationToken(null);

        userRepository.save(user);
        String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quiz Application</title>
                </head>
                
                <body style="font-family:Arial;text-align:center;padding:80px;">
                
                    <h1 style="color:green;">
                            Email Verified Successfully
                    </h1>
                
                    <p>
                        Your account has been successfully verified.
                    </p>
                
                    <a href="https://ai-powerd-quiz-application-7drs.vercel.app/login">
                        Login Now
                    </a>
                
                </body>
                
                </html>
                """;

        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    @Transactional
    @PutMapping("/acc/update")
    public ResponseEntity<?> updateUser(@RequestBody User user, Authentication authentication){
        if(user.getId().isBlank() || user.getId().isEmpty()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message","Please provide user._id to update your account !!"));
        }
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        if(userOpt.isEmpty()){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message","User not found with this user._id !!"));
        }
        User savedUser = userOpt.get();
        savedUser.setName(user.getName());
        boolean emailUpdated = !savedUser.getEmail().equals(user.getEmail());
        savedUser.setEmail(user.getEmail());
        savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        if ("admin".equals(savedUser.getRole()) && emailUpdated) {
            savedUser.setVerified(false);
            String token = UUID.randomUUID().toString();
            savedUser.setVerificationToken(token);
            emailService.sendVerificationEmail(savedUser.getEmail(), token);
        }
        String s = emailUpdated ? "Please Verify your email to login" : "Your account updated successfully";
        User saved = userRepository.save(savedUser);
        UpdateResponse response = new UpdateResponse(s,emailUpdated,new UserInfo(saved.getId(),saved.getName(),saved.getEmail(),saved.getRole()));
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

