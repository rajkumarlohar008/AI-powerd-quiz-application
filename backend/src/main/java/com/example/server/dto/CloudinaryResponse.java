package com.example.server.dto;


import lombok.Getter;

@Getter
public class CloudinaryResponse {

    private String imageUrl;
    private String publicId;

    public CloudinaryResponse(String imageUrl, String publicId) {
        this.imageUrl = imageUrl;
        this.publicId = publicId;
    }

}
