package com.example.server.controller;

import com.example.server.model.Presets;
import com.example.server.model.User;
import com.example.server.repository.PresetRepository;
import com.example.server.repository.UserRepository;
import com.example.server.services.PresetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PresetController {

    private final PresetService presetService;

    public PresetController(PresetService presetService) {
        this.presetService = presetService;
    }

    @GetMapping("/preset")
    public ResponseEntity<?> getPreset(@RequestParam("query") String query) {
        return presetService.getPresets(query);
    }

    @PostMapping("/preset/create")
    public ResponseEntity<?> createPreset(@RequestBody Presets preset, Authentication authentication) {
        return presetService.createPresets(preset,authentication);
    }

    @GetMapping("/preset/mine")
    public ResponseEntity<?> getPresets(Authentication authentication) {
        return presetService.getPresets(authentication);
    }

    @DeleteMapping("/preset/delete")
    public ResponseEntity<?> deletePreset(@RequestParam("id") String id, Authentication authentication) {
        return presetService.deletePreset(id,authentication);
    }

    @GetMapping("/preset/all")
    public ResponseEntity<?> getAllPresets() {
        return presetService.getAllPresets();
    }

    @GetMapping("/preset/id")
    public ResponseEntity<?> getPresetById(@RequestParam("id") String id) {
        return presetService.getPresetById(id);
    }


    @PutMapping("/preset/update")
    public ResponseEntity<?> updatePreset(@RequestBody Presets preset,Authentication authentication) {
        return presetService.updatePreset(preset,authentication);
    }
}