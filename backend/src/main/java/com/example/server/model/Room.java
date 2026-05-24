package com.example.server.model;

import com.example.server.dto.RoomResponseRequest;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "rooms")
public class Room {

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

    // WITHOUT THIS GETTER, JACKSON CANNOT SERIALIZE THE ID FIELD INTO JSON!
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public List<RoomQuestions> getQuestions() {
        return questions;
    }

    public void setQuestions(List<RoomQuestions> questions) {
        this.questions = questions;
    }

    public List<RoomResponseRequest> getUserResponse() {
        return userResponse;
    }

    public void setUserResponse(List<RoomResponseRequest> userResponse) {
        this.userResponse = userResponse;
    }
}