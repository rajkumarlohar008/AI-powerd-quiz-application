package com.example.server.controller;

import com.example.server.dto.RoomResponseRequest;
import com.example.server.model.Room;
import com.example.server.model.User;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.UserRepository;
import com.example.server.services.RoomService;
import jakarta.validation.Valid;
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
public class RoomController {
    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    UserRepository userRepository;

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }



    @PostMapping("/room")
    public ResponseEntity<?> createRoom(@Valid @RequestBody Room request, Authentication authentication) {
        return roomService.createRoom(request,authentication);
    }

    @GetMapping("/getRoom/id")
    public ResponseEntity<?> getRoomById(@RequestParam("roomId") String id,Authentication authentication) {
        return roomService.getRoomById(id,authentication);
    }

    @GetMapping("/room/all")
    public ResponseEntity<?> getAllRooms(Authentication authentication) {
        return roomService.getAllRoom(authentication);
    }

    @PostMapping("/quizRoom/quiz-attempt") // Don't forget your mapping annotation if it's missing!
    public ResponseEntity<?> saveRoomQuizAttempt(@RequestParam("roomId") String id, @RequestBody RoomResponseRequest request) {
        return roomService.saveRoomQuizAttempt(id,request);
    }

    @GetMapping("/room/{id}/responses")
    public ResponseEntity<?> getSortedResponses(@PathVariable("id") String id) {
        return roomService.getShortedResponse(id);
    }

    @DeleteMapping("/room/delete")
    public ResponseEntity<?> deleteRoom(@RequestParam("roomId") String id, Authentication authentication) {
        return roomService.deleteRoom(id,authentication);
    }

    @DeleteMapping("/room/response/delete")
    public ResponseEntity<?> deleteRoomResponse(@RequestParam("index") int index, @RequestParam("id") String id) {
        return roomService.deleteRoomResponse(index,id);
    }

    @PutMapping("/room/update")
    public ResponseEntity<?> updateRoom(@RequestBody Room room,Authentication authentication){
        return roomService.updateRoom(room,authentication);
    }
}
