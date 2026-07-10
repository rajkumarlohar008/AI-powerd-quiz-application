package com.example.server.controller;

import com.example.server.dto.*;
import com.example.server.model.*;
import com.example.server.repository.PresetRepository;
import com.example.server.repository.QuizAttemptRepository;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.UserRepository;
import com.example.server.security.EmailService;
import com.example.server.security.JwtService;
import com.example.server.services.AuthService;
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
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/helth")
    public String helth() {
        return "ok";
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(@RequestPart("request") RegisterRequest request, @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
        return authService.register(request,file);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam String token) {
        return authService.verify(token);
    }

    @PutMapping("/acc/update")
    public ResponseEntity<?> updateUser(@Valid @RequestPart("user") UpdateRequest user, @RequestPart(value = "file", required = false) MultipartFile file, @RequestParam("removeImage") boolean removeImage, Authentication authentication) throws IOException {
        return  authService.update(user,file,removeImage,authentication);
    }


    @DeleteMapping("/acc/delete")
    public ResponseEntity<?> deleteUser(@Valid @RequestBody DeleteRequest request, Authentication authentication) throws IOException {
        return authService.delete(request,authentication);
    }
}

