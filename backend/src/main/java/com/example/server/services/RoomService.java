package com.example.server.services;

import com.example.server.dto.RoomResponseRequest;
import com.example.server.model.Room;
import com.example.server.model.User;
import com.example.server.repository.RoomRepository;
import com.example.server.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class RoomService {
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final CertificateService certificateService;

    public RoomService(UserRepository userRepository, RoomRepository roomRepository, CertificateService certificateService) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.certificateService = certificateService;
    }

    @Transactional
    public ResponseEntity<?> createRoom(Room request, Authentication authentication){
        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User email is required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        User user = userOpt.get();

        request.setCreatedBy(email);
        Room savedRoom = roomRepository.save(request);

        if (user.getRooms() != null) {
            user.getRooms().add(savedRoom);
        } else {
            user.setRooms(new ArrayList<>(List.of(savedRoom)));
        }
        userRepository.save(user);

        return ResponseEntity.ok(savedRoom);
    }

    public ResponseEntity<?> getRoomById(String id , Authentication authentication){
        if (id == null || id.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }
        Room room = roomOpt.get();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!isAdmin) {
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is required."));
        }

        if (request.getUserName() == null || request.getUserName().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Name is required."));
        }

        Optional<Room> roomOpt = roomRepository.findById(id);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }
        Room room = roomOpt.get();

        String emailKey = request.getUserId().trim().toLowerCase(Locale.ENGLISH);
        if (room.getUserResponse() != null) {
            boolean alreadyAttempted = room.getUserResponse().stream()
                    .anyMatch(r -> r.getUserId() != null
                            && r.getUserId().trim().toLowerCase(Locale.ENGLISH).equals(emailKey));
            if (alreadyAttempted) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "You have already attempted this room quiz. Only one attempt is allowed."
                ));
            }
        }

        request.setCertificateAllowed(false);
        request.setUserId(emailKey);

        if (room.getUserResponse() != null) {
            room.getUserResponse().add(request);
        } else {
            List<RoomResponseRequest> responses = new ArrayList<>();
            responses.add(request);
            room.setUserResponse(responses);
        }

        roomRepository.save(room);
        return ResponseEntity.ok(request);
    }

    public ResponseEntity<?> getAttemptStatus(String roomId, String email) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email is required."));
        }

        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();
        String emailKey = email.trim().toLowerCase(Locale.ENGLISH);
        Optional<RoomResponseRequest> match = findResponse(room, emailKey);

        Map<String, Object> body = new HashMap<>();
        body.put("roomId", roomId);
        body.put("roomName", room.getRoomName());
        body.put("alreadyAttempted", match.isPresent());
        if (match.isPresent()) {
            RoomResponseRequest r = match.get();
            body.put("certificateAllowed", r.isCertificateAllowed());
            body.put("correct", r.getCorrect());
            body.put("total", r.getTotal());
            body.put("percentage", r.getPercentage());
            body.put("userName", r.getUserName());
        } else {
            body.put("certificateAllowed", false);
        }
        return ResponseEntity.ok(body);
    }

    @Transactional
    public ResponseEntity<?> setCertificateAllowed(String roomId, String userId, boolean allowed) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "user email is required."));
        }

        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();
        String emailKey = userId.trim().toLowerCase(Locale.ENGLISH);
        Optional<RoomResponseRequest> match = findResponse(room, emailKey);
        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Participant response not found."));
        }

        match.get().setCertificateAllowed(allowed);
        roomRepository.save(room);

        return ResponseEntity.ok(Map.of(
                "message", allowed ? "Certificate download enabled." : "Certificate download disabled.",
                "userId", emailKey,
                "certificateAllowed", allowed
        ));
    }

    public ResponseEntity<?> downloadCertificate(String roomId, String email) {
        if (roomId == null || roomId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "room id is required."));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email is required."));
        }

        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Room not found."));
        }

        Room room = roomOpt.get();
        String emailKey = email.trim().toLowerCase(Locale.ENGLISH);
        Optional<RoomResponseRequest> match = findResponse(room, emailKey);
        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No quiz attempt found for this email."));
        }

        RoomResponseRequest response = match.get();
        if (!response.isCertificateAllowed()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Certificate is not available yet. Please wait for admin approval."
            ));
        }

        User admin = resolveRoomAdmin(room);
        try {
            byte[] pdf = certificateService.generateCertificate(
                    response.getUserName(),
                    room.getRoomName(),
                    response,
                    admin
            );

            String safeName = (response.getUserName() != null ? response.getUserName() : "participant")
                    .replaceAll("[^a-zA-Z0-9-_ ]", "")
                    .trim()
                    .replace(' ', '_');
            String filename = "certificate_" + safeName + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Failed to generate certificate: " + e.getMessage()
            ));
        }
    }

    private Optional<RoomResponseRequest> findResponse(Room room, String emailKey) {
        if (room.getUserResponse() == null) {
            return Optional.empty();
        }
        return room.getUserResponse().stream()
                .filter(r -> r.getUserId() != null
                        && r.getUserId().trim().toLowerCase(Locale.ENGLISH).equals(emailKey))
                .findFirst();
    }

    private User resolveRoomAdmin(Room room) {
        if (room.getCreatedBy() != null && !room.getCreatedBy().isBlank()) {
            Optional<User> byCreator = userRepository.findByEmail(room.getCreatedBy());
            if (byCreator.isPresent()) {
                return byCreator.get();
            }
        }
        // Fallback for older rooms without createdBy: find an admin who owns this room
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.getRooms() == null) continue;
            boolean owns = u.getRooms().stream()
                    .anyMatch(r -> r.getId() != null && r.getId().equals(room.getId()));
            if (owns) {
                return u;
            }
        }
        return null;
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
