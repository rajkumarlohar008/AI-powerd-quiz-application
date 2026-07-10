package com.example.server.services;

import com.example.server.dto.*;
import com.example.server.model.User;
import com.example.server.repository.PresetRepository;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.UserRepository;
import com.example.server.security.EmailService;
import com.example.server.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CloudinaryService cloudinaryService;
    private final JwtService jwtService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final RoomRepository roomRepository;
    private final PresetRepository presetRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService, CloudinaryService cloudinaryService, JwtService jwtService, QuizAttemptRepository quizAttemptRepository, RoomRepository roomRepository, PresetRepository presetRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cloudinaryService = cloudinaryService;
        this.jwtService = jwtService;
        this.quizAttemptRepository = quizAttemptRepository;
        this.roomRepository = roomRepository;
        this.presetRepository = presetRepository;
    }

    public ResponseEntity<? extends Object> register(RegisterRequest request, MultipartFile file) throws IOException {
        if (userRepository.existsByEmail(request.getEmail())) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Email Already Exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        String message = new String();
        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCreatedAt(LocalDate.now());
        user.setPresets(new ArrayList<>());
        user.setRooms(new ArrayList<>());


        if ("admin".equals(request.getRole())) {
            try {
                user.setVerified(false);
                String token = UUID.randomUUID().toString();
                user.setVerificationToken(token);
                emailService.sendVerificationEmail(user.getEmail(), token);
                message = "Verification Email Sent";
            } catch (Exception e) {
                message = "Exception :" + e.getMessage();
            }
        }
        if (file != null && !file.isEmpty()) {
            CloudinaryResponse response = cloudinaryService.uploadImage(file);
            user.setImageURL(response.getImageUrl());
            user.setCloudinaryId(response.getPublicId());
        } else {
            user.setImageURL("https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.getName());
        }
        User saved = userRepository.save(user);

        if (saved.getRole().equals("admin")) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", message);
            body.put("user", saved);
            return ResponseEntity.status(HttpStatus.OK).body(new UserInfo(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getImageURL(), saved.getCloudinaryId()));
        }
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Registered Successfully");
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    public ResponseEntity<?> login(LoginRequest request) {
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
        LoginResponse response = new LoginResponse("Login successful", token, new UserInfo(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getImageURL(), user.getCloudinaryId()));

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> verify(String token) {
        User user = userRepository.findByVerificationToken(token);

        if (user == null) {
            String html = """
                        <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Quiz Application</title>
                    </head>
                    
                    <body style="font-family:Arial;text-align:center;padding:80px;">
                    
                        <h1 style="color:red;">
                                Invalid verification link.
                        </h1>
                    </body>
                    
                    </html>
                    """;
            return ResponseEntity.badRequest().contentType(MediaType.TEXT_HTML).body(html);

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
    public ResponseEntity<?> update(UpdateRequest user, MultipartFile file, boolean removeImage, Authentication authentication) throws IOException {
        if (user.getId() == null || user.getId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Please provide user._id to update your account !!"));
        }

        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Authenticated user not found."));
        }

        User savedUser = userOpt.get();
        if (user.getName() != null) {
            savedUser.setName(user.getName());
        }

        boolean emailUpdated = !Objects.equals(savedUser.getEmail(), user.getEmail());
        savedUser.setEmail(user.getEmail());

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        savedUser.setUpdatedAt(LocalDate.now());
        if ("admin".equals(savedUser.getRole()) && emailUpdated) {
            savedUser.setVerified(false);
            String token = UUID.randomUUID().toString();
            savedUser.setVerificationToken(token);
            emailService.sendVerificationEmail(savedUser.getEmail(), token);
        }

        String message = emailUpdated ? "Please Verify your email to login" : "Your account updated successfully";
        String previousCloudinaryId = savedUser.getCloudinaryId();
        if (removeImage) {
            if (previousCloudinaryId != null && !previousCloudinaryId.isBlank()) {
                try {
                    cloudinaryService.deleteImage(previousCloudinaryId);
                } catch (Exception e) {
// optionally log the error; deletion failures should not block the update
// logger.warn("Failed to delete image from Cloudinary: {}", previousCloudinaryId, e);
                }
                savedUser.setCloudinaryId("");
            }
            String seedName = savedUser.getName() != null ? savedUser.getName() : "user";
            savedUser.setImageURL("https://api.dicebear.com/7.x/avataaars/svg?seed=" + URLEncoder.encode(seedName, StandardCharsets.UTF_8));
        } else {
            if (file != null && !file.isEmpty()) {
                if (previousCloudinaryId != null && !previousCloudinaryId.isBlank()) {
                    try {
                        cloudinaryService.deleteImage(previousCloudinaryId);
                    } catch (Exception e) {
// logger.warn("Failed to delete previous Cloudinary image: {}", previousCloudinaryId, e);
                    }
                    savedUser.setCloudinaryId("");
                }
                CloudinaryResponse uploadResp = cloudinaryService.uploadImage(file);
                if (uploadResp != null) {
                    savedUser.setImageURL(uploadResp.getImageUrl());
                    savedUser.setCloudinaryId(uploadResp.getPublicId());
                }
            }
        }

        User saved = userRepository.save(savedUser);

        UpdateResponse response = new UpdateResponse(message, emailUpdated, new UserInfo(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getImageURL(), saved.getCloudinaryId()));

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @Transactional
    public ResponseEntity<?> delete(DeleteRequest request , Authentication authentication) throws IOException {
        if (request.getId() == null || request.getId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "You can't delete this account !!"));
        }

        String email = authentication.getName();
        if (email.equals(request.getEmail())) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Your account not found !!"));
            }
            User user = userOpt.get();

            // 1. Delete associated quiz attempts via targeted query
            quizAttemptRepository.deleteByUserId(user.getId());

            // 2. Optimized Room deletion: Pass the user's specific rooms directly to the repository
            if (user.getRooms() != null && !user.getRooms().isEmpty()) {
                roomRepository.deleteAll(user.getRooms());
            }

            // 3. Optimized Presets deletion: Pass the user's specific presets directly to the repository
            if (user.getPresets() != null && !user.getPresets().isEmpty()) {
                presetRepository.deleteAll(user.getPresets());
            }
            cloudinaryService.deleteImage(user.getCloudinaryId());
            // 4. Delete the main user entity
            userRepository.delete(user);

            return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "Account deleted successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Please provide correct Email !!"));
        }
    }
}
