package com.example.server.services;

import com.example.server.model.Presets;
import com.example.server.model.User;
import com.example.server.repository.PresetRepository;
import com.example.server.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PresetService {
    private final PresetRepository presetRepository;
    private final UserRepository userRepository;

    public PresetService(PresetRepository presetRepository, UserRepository userRepository) {
        this.presetRepository = presetRepository;
        this.userRepository = userRepository;
    }

    public ResponseEntity<?> getPresets(String query){
        List<Presets> preset = presetRepository.searchByPresetName(query);
        if (preset.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Failed to get quiz.");
            body.put("query", new ArrayList<>()); // Provide an empty array to prevent client mapping crashes
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Here is your preset.");
        body.put("query", preset);
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    @Transactional
    public ResponseEntity<?> createPresets(Presets preset, Authentication authentication){
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userOpt.get();

        Presets savedPreset = presetRepository.save(preset);

        // Update relationship safely
        if (user.getPresets() != null) {
            user.getPresets().add(savedPreset);
        } else {
            List<Presets> newList = new ArrayList<>();
            newList.add(savedPreset);
            user.setPresets(newList);
        }
        userRepository.save(user);

        return ResponseEntity.ok(savedPreset);
    }

    public ResponseEntity<?> getPresets(Authentication authentication){
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String id = authentication.getName();
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User ID is required."));
        }

        Optional<User> userInfo = userRepository.findByEmail(id);
        if (userInfo.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userInfo.get();
        if(user.getPresets() != null && user.getPresets().size() == 0){
            Map<String,Object> body = new HashMap<>();
            body.put("message","You haven't create any presets,Please create one !!");
            return ResponseEntity.status(HttpStatus.OK).body(body);
        }
        if(user.getPresets() != null){
            return ResponseEntity.ok(Map.of("message","Here is your presets !!","presets",user.getPresets()));
        }else{
            user.setPresets(new ArrayList<>());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message","You haven't create any presets,Please create one !!"));
        }
    }

    @Transactional
    public ResponseEntity<?> deletePreset(String id , Authentication authentication){
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication required."));
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userOpt.get();

        Optional<Presets> targetPresetOpt = presetRepository.findById(id);
        if (targetPresetOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Preset not found."));
        }

        boolean ownsPreset = user.getPresets() != null && user.getPresets().stream()
                .anyMatch(p -> p.getId() != null && p.getId().equals(id));

        if (!ownsPreset) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "You can't delete this preset this is not your preset !.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        user.getPresets().removeIf(presets -> presets.getId().equals(id));
        userRepository.save(user);
        presetRepository.deleteById(id);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Preset Deleted !.");
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    public ResponseEntity<?> getAllPresets(){
        List<Presets> all = presetRepository.findAll();
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Here is your presets.");
        body.put("query", all);
        return ResponseEntity.ok(body);
    }

    public ResponseEntity<?> getPresetById(String id){
        Optional<Presets> presetOPt = presetRepository.findById(id);
        if (presetOPt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Preset not found.");
            // FIXED: Added missing return statement to prevent execution fall-through code crashes
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Here is your Preset.");
        body.put("query", presetOPt.get());
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    @Transactional
    public ResponseEntity<?> updatePreset(Presets preset , Authentication authentication){
        if (preset.getId() == null || preset.getId().isBlank()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Preset id not provided !.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        Optional<Presets> presetOpt = presetRepository.findById(preset.getId());
        if (presetOpt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Preset not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        Presets presets = presetOpt.get();
        presets.setPresetName(preset.getPresetName());
        presets.setQuestions(preset.getQuestions());
        Presets saved = presetRepository.save(presets);
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        boolean ownsPreset = user.getPresets() != null && user.getPresets().stream()
                .anyMatch(p -> p.getId() != null && p.getId().equals(preset.getId()));

        if (!ownsPreset) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "You can't update this preset this is not your preset !.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        user.getPresets().removeIf(presets1 -> presets1.getId().equals(preset.getId()));
        user.getPresets().add(saved);
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.OK).body(saved);
    }
}
