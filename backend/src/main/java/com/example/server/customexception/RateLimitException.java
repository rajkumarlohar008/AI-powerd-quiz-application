package com.example.server.customexception;

public class RateLimitException extends AIException {

    public RateLimitException(String message) {
        super(message);
    }

}
