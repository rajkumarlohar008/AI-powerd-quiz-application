package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateResponse {
    private String message;
    private boolean emailUpdate;
    private UserInfo user;
}
