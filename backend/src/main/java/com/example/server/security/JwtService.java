package com.example.server.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final String secret;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    // Generate JWT token
    public String generateToken(String userId, String email) {

        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMs);

        Algorithm algorithm = Algorithm.HMAC256(secret);

        return JWT.create()
                .withSubject(email)
                .withClaim("userId", userId)
                .withClaim("email", email)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    // Verify and decode token
    public DecodedJWT verifyToken(String token) {

        Algorithm algorithm = Algorithm.HMAC256(secret);

        return JWT.require(algorithm)
                .build()
                .verify(token);
    }

    // Extract email from token
    public String extractEmail(String token) {

        return verifyToken(token)
                .getClaim("email")
                .asString();
    }

    // Extract userId from token
    public String extractUserId(String token) {

        return verifyToken(token)
                .getClaim("userId")
                .asString();
    }

    // Check if token is valid
    public boolean isTokenValid(String token) {

        try {
            verifyToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}