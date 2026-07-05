package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {

    private String id;
    private String name;
    private String email;
    private String role;
    private String imageUrl;
    private String cludinaryId;

    //    public UserInfo() {

    public void setRole(String role) {
        this.role = role;
    }
//    }

    public String getRole() {
        return role;
    }

    public UserInfo(String id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

}

