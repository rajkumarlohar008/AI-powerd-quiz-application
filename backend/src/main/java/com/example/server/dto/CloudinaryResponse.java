package com.example.server.dto;


public class CloudinaryResponse {

    private String imageUrl;
    private String publicId;

    public CloudinaryResponse(String imageUrl, String publicId) {
        this.imageUrl = imageUrl;
        this.publicId = publicId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getPublicId() {
        return publicId;
    }
}
