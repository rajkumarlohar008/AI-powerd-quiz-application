package com.example.server.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LoginResponse {

    private String message;
    private String token;
    private UserInfo user;

    public LoginResponse() {
    }

    public LoginResponse(String message, String token, UserInfo user) {
        this.message = message;
        this.token = token;
        this.user = user;
    }

}

