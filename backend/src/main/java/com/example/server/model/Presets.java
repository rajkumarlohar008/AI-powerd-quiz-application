package com.example.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "presets")
@Data
public class Presets {
    @Id
    private String id;
    private String presetName;
    private List<RoomQuestions> questions;
}
