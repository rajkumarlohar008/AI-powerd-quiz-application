package com.example.server.controller;

import com.example.server.dto.*;
import com.example.server.model.*;
import com.example.server.repository.UserRepository;
import com.example.server.security.EmailService;
import com.example.server.security.JwtService;
import com.example.server.services.CloudinaryService;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
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
    private final CloudinaryService cloudinaryService;

    public AuthController(PasswordEncoder passwordEncoder, EmailService emailService, UserRepository userRepository, JwtService jwtService, CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.cloudinaryService = cloudinaryService;
    }

    @GetMapping("/helth")
    public String helth() {
        return "ok";
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(@RequestPart("request") RegisterRequest request, @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
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
            user.setCoudinaryId(response.getPublicId());
        } else {
            user.setImageURL("https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.getName());
        }
        User saved = userRepository.save(user);

        if (saved.getRole().equals("admin")) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", message);
            body.put("user", saved);
            return ResponseEntity.status(HttpStatus.OK).body(new UserInfo(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getImageURL(), saved.getCoudinaryId()));
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
        LoginResponse response = new LoginResponse("Login successful", token, new UserInfo(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getImageURL(), user.getCoudinaryId()));

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
    public ResponseEntity<?> updateUser(@Valid @RequestPart("user") UpdateRequest user, @RequestPart(value = "file", required = false) MultipartFile file, @RequestParam("removeImage") boolean removeImage, Authentication authentication) throws IOException {

        if (user.getId() == null || user.getId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Please provide user._id to update your account !!"));
        }

        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Authenticated user not found."));
        }

        User savedUser = userOpt.get();

// Update basic fields
        if (user.getName() != null) {
            savedUser.setName(user.getName());
        }

        boolean emailUpdated = !Objects.equals(savedUser.getEmail(), user.getEmail());
        savedUser.setEmail(user.getEmail());

        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        savedUser.setUpdatedAt(LocalDate.now());

// If admin and email changed, mark unverified and send verification
        if ("admin".equals(savedUser.getRole()) && emailUpdated) {
            savedUser.setVerified(false);
            String token = UUID.randomUUID().toString();
            savedUser.setVerificationToken(token);
            emailService.sendVerificationEmail(savedUser.getEmail(), token);
        }

        String message = emailUpdated ? "Please Verify your email to login" : "Your account updated successfully";

// Store the previously saved cloudinary id (the one currently stored in DB) to delete if needed
        String previousCloudinaryId = savedUser.getCoudinaryId();

// CASE A: removeImage = true -> delete previous image (if exists) and set avatar URL
        if (removeImage) {
            if (previousCloudinaryId != null && !previousCloudinaryId.isBlank()) {
                try {
                    cloudinaryService.deleteImage(previousCloudinaryId);
                } catch (Exception e) {
// optionally log the error; deletion failures should not block the update
// logger.warn("Failed to delete image from Cloudinary: {}", previousCloudinaryId, e);
                }
                savedUser.setCoudinaryId("");
            }
// Use avatar generator with the (possibly updated) name
            String seedName = savedUser.getName() != null ? savedUser.getName() : "user";
            savedUser.setImageURL("https://api.dicebear.com/7.x/avataaars/svg?seed=" + URLEncoder.encode(seedName, StandardCharsets.UTF_8));
        } else {
// CASE B: removeImage = false and a new file is provided -> replace previous image with new one
            if (file != null && !file.isEmpty()) {
// delete existing image first (using the saved user's cloudinary id)
                if (previousCloudinaryId != null && !previousCloudinaryId.isBlank()) {
                    try {
                        cloudinaryService.deleteImage(previousCloudinaryId);
                    } catch (Exception e) {
// logger.warn("Failed to delete previous Cloudinary image: {}", previousCloudinaryId, e);
                    }
// clear old id before uploading new
                    savedUser.setCoudinaryId("");
                }

// upload new image and set url + public id
                CloudinaryResponse uploadResp = cloudinaryService.uploadImage(file);
                if (uploadResp != null) {
                    savedUser.setImageURL(uploadResp.getImageUrl());
                    savedUser.setCoudinaryId(uploadResp.getPublicId());
                }
            } else {
// no file provided and removeImage is false -> do nothing to image fields (keep existing)
            }
        }

        User saved = userRepository.save(savedUser);

        UpdateResponse response = new UpdateResponse(message, emailUpdated, new UserInfo(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getImageURL(), saved.getCoudinaryId()));

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}

