package com.example.server.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "users")
@Data
public class User {

    @Id
    private String id;
    private String name;
    @Indexed(unique = true)
    private String email;
    private String password;
    private String imageURL;
    private String cloudinaryId;
    private LocalDate createdAt;
    private List<Presets> presets;
    private String role;
    private boolean verified;
    private String verificationToken;
    private LocalDate updatedAt;
    private List<Room> rooms;
    public User() {
    }

    public User(String name, String email, String password , String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

}

