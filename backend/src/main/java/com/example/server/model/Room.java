package com.example.server.model;

import com.example.server.dto.RoomResponseRequest;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Setter
@Getter
@Document(collection = "rooms")
public class Room {

    // WITHOUT THIS GETTER, JACKSON CANNOT SERIALIZE THE ID FIELD INTO JSON!
    @Id
    private String id;
    private String roomName;
    private List<RoomQuestions> questions;
    private List<RoomResponseRequest> userResponse;

    // 1. Default No-Args Constructor (Required by Spring Data / Jackson)
    public Room() {
    }

    // 2. All-Args Constructor
    public Room(String id, String roomName, List<RoomQuestions> questions, List<RoomResponseRequest> userResponse) {
        this.id = id;
        this.roomName = roomName;
        this.questions = questions;
        this.userResponse = userResponse;
    }

    // 3. Convenience Constructor (Without ID for creating new rooms)
    public Room(String roomName, List<RoomQuestions> questions, List<RoomResponseRequest> userResponse) {
        this.roomName = roomName;
        this.questions = questions;
        this.userResponse = userResponse;
    }

    // ==========================================
    // CRITICAL FIX: Public Getters and Setters
    // ==========================================

}