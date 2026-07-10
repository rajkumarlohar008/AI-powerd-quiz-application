package com.example.server.services;

import com.example.server.dto.RoomResponseRequest;
import com.example.server.model.Room;
import com.example.server.model.User;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class RoomService {
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;


    public RoomService(UserRepository userRepository, RoomRepository roomRepository) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional
    public ResponseEntity<?> createRoom(Room request, Authentication authentication){
        String email = authentication.getName();
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
        if (user.getRooms() != null) {
            user.getRooms().add(savedRoom);
        } else {
            user.setRooms(Arrays.asList(savedRoom));
        }
        userRepository.save(user); // Save the user to persist the relationship change

        return ResponseEntity.ok(savedRoom);
    }

    public ResponseEntity<?> getRoomById(String id , Authentication authentication){
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        Optional<Room> roomOpt = roomRepository.findById(id);
        Room room = roomOpt.get();
        String role = authentication.getAuthorities().stream().findFirst().get().getAuthority();
        System.out.println(role);
        if(!role.equals("ROLE_ADMIN")){
            room.setUserResponse(null);
        }
        return ResponseEntity.ok(room);
    }

    public ResponseEntity<?> getAllRoom(Authentication authentication){
        String id = authentication.getName();
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User ID is required."));
        }

        Optional<User> userInfo = userRepository.findByEmail(id);
        User user = userInfo.get();
        return ResponseEntity.ok(user.getRooms());
    }

    @Transactional
    public ResponseEntity<?> saveRoomQuizAttempt(String id, RoomResponseRequest request){
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User ID is required."));
        }

        if (userRepository.findById(request.getUserId()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User not found."));
        }

        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }
        Room room = roomOpt.get();

        if (room.getUserResponse() != null) {
            room.getUserResponse().add(request);
        } else {
            room.setUserResponse(List.of(request));
        }

        Room savedRoom = roomRepository.save(room);

        return ResponseEntity.ok(request);
    }

    public ResponseEntity<?> getShortedResponse(String id){
        Optional<Room> roomOpt = roomRepository.findById(id);

        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();
        if (room.getUserResponse() != null) {
            List<RoomResponseRequest> sortedResponses = room.getUserResponse().stream().sorted(
                    Comparator.comparingDouble(RoomResponseRequest::getPercentage).reversed()
                            .thenComparing(RoomResponseRequest::getTimeTaken, Comparator.nullsLast(Comparator.naturalOrder()))).toList();

            return ResponseEntity.ok(sortedResponses);
        } else {
            return ResponseEntity.ok(new ArrayList<RoomResponseRequest>());
        }
    }

    @Transactional
    public ResponseEntity<?> deleteRoom(String id , Authentication authentication){
        String email = authentication.getName();
        if (id == null || id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Room ID is required."));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is required."));
        }

        try {
            Optional<User> userInfo = userRepository.findByEmail(email);

            if (userInfo.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found with provided email."));
            }

            User user = userInfo.get();

            user.getRooms().removeIf(room -> room.getId().equals(id));

            userRepository.save(user);

            roomRepository.deleteById(id);

            return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "Room Deleted.", "user", user));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to delete room: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> deleteRoomResponse(int index , String id){
        Optional<Room> roomOpt = roomRepository.findById(id);

        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();

        if (room.getUserResponse() == null || room.getUserResponse().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No responses found."));
        }

        List<RoomResponseRequest> sortedResponses = new ArrayList<>(room.getUserResponse().stream().sorted(Comparator.comparingDouble(RoomResponseRequest::getPercentage).reversed().thenComparing(RoomResponseRequest::getTimeTaken, Comparator.nullsLast(Comparator.naturalOrder()))).toList());

        if (index < 0 || index >= sortedResponses.size()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid index."));
        }

        sortedResponses.remove(index);

        room.setUserResponse(sortedResponses);

        roomRepository.save(room);

        return ResponseEntity.ok(Map.of("message", "Deleted successfully", "remainingResponses", sortedResponses));
    }

    @Transactional
    public ResponseEntity<?> updateRoom(Room room,Authentication authentication){
        if(room.getId().isEmpty() ||room.getId().isBlank()){
            Map<String,Object> body = new HashMap<>();
            body.put("massage","please provide room id to update room !");
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        Optional<Room> roomOpt = roomRepository.findById(room.getId());
        if(roomOpt.isEmpty()){
            Map<String,Object> body = new HashMap<>();
            body.put("massage","Room Not found !");
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        Room room1 = roomOpt.get();
        room1.setRoomName(room.getRoomName());
        room1.setQuestions(room.getQuestions());
        Room saved = roomRepository.save(room1);
        Optional<User> userOpt = userRepository.findByEmail(authentication.getName());
        if(userOpt.isEmpty()){
            Map<String,Object> body = new HashMap<>();
            body.put("massage","User not found !");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        User user = userOpt.get();
        user.getRooms().removeIf(room2 -> room2.getId().equals(room.getId()));
        user.getRooms().add(saved);
        userRepository.save(user);
        Map<String,Object> body = new HashMap<>();
        body.put("massage","Room Updated !");
        body.put("room",saved);
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }
}
