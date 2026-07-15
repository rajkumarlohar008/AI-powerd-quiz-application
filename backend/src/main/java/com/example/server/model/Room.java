package com.example.server.model;

import com.example.server.dto.RoomResponseRequest;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rooms")
public class Room {

    // WITHOUT THIS GETTER, JACKSON CANNOT SERIALIZE THE ID FIELD INTO JSON!
    @Id
    private String id;
    private String roomName;
    private List<RoomQuestions> questions;
    private List<RoomResponseRequest> userResponse;

    public Room(String roomName, List<RoomQuestions> questions, List<RoomResponseRequest> userResponse) {
        this.roomName = roomName;
        this.questions = questions;
        this.userResponse = userResponse;
    }

}