package com.example.server.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket; // We use Bucket.builder() directly now
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple IP‑based rate limiting filter using Bucket4j.
 * Limits each client IP to 100 requests per minute (configurable).
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int REQUESTS_PER_MINUTE = 100;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        // Changed Bucket4j.builder() to Bucket.builder()
        return buckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(REQUESTS_PER_MINUTE, Refill.greedy(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))))
                .build());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        Bucket bucket = resolveBucket(ip);
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            // Changed from HttpServletResponse.SC_TOO_MANY_REQUESTS to 429
            response.setStatus(429);
            response.getWriter().write("Too many requests - rate limit exceeded");
        }
    }

}
