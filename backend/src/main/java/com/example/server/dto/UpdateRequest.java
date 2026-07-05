package com.example.server.dto;

import lombok.Data;

@Data
public class UpdateRequest {
    private String id;
    private String name;
    private String email;
    private String role;
    private String imageUrl;
    private String cloudinaryId;
    private String password;
}
