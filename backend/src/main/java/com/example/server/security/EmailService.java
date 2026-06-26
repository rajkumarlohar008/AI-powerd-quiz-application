package com.example.server.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String token) {
        String verificationLink =
                "http://localhost:8080/api/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Verify Your Email");
        message.setText(
                "Click the link below to verify your account:\n\n"
                        + verificationLink);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}