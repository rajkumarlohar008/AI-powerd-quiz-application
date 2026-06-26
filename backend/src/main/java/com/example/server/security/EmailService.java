package com.example.server.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import sibModel.*;
import sibApi.TransactionalEmailsApi;
import sendinblue.ApiClient;
import sendinblue.Configuration;
import sendinblue.auth.ApiKeyAuth;

import java.util.Collections;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    private TransactionalEmailsApi apiInstance;

    @PostConstruct
    public void init() {
        // Initialize the Brevo HTTP client with your API key
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKeyAuth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKeyAuth.setApiKey(apiKey);
        this.apiInstance = new TransactionalEmailsApi();
    }

    public void sendVerificationEmail(String to, String token) {

        String verificationLink = baseUrl + "/api/verify?token=" + token;

        // Base structural template block using an explicit lookup key placeholder: {{VERIFICATION_LINK}}
        String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Verify Your Email</title>
                </head>
                <body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:40px 20px;">
                <tr>
                <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);">
                <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;color:white;">
                <div style="font-size:56px;">🧠</div>
                <h1 style="margin:15px 0 5px;font-size:30px;">Quiz Application</h1>
                <p style="margin:0;font-size:17px;opacity:.9;">Verify your email address</p>
                </td>
                </tr>
                <tr>
                <td style="padding:45px;">
                <h2 style="margin-top:0;color:#222;">Welcome! 👋</h2>
                <p style="font-size:16px;color:#555;line-height:1.8;">
                Thank you for registering with <strong>Quiz Application</strong>.
                </p>
                <p style="font-size:16px;color:#555;line-height:1.8;">
                Please verify your email address to activate your account.
                </p>
                <table width="100%">
                <tr>
                <td align="center" style="padding:30px;">
                <a href="{{VERIFICATION_LINK}}" style="background:#4f46e5;color:white;text-decoration:none;padding:15px 35px;border-radius:8px;font-size:18px;font-weight:bold;display:inline-block;">
                Verify Email
                </a>
                </td>
                </tr>
                </table>
                <p style="font-size:15px;color:#777;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break:break-all;"><a href="{{VERIFICATION_LINK}}">{{VERIFICATION_LINK}}</a></p>
                <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
                <p style="font-size:14px;color:#777;">This verification link will expire in 24 hours.</p>
                <p style="font-size:14px;color:#777;">If you didn't create this account, you can safely ignore this email.</p>
                </td>
                </tr>
                <tr>
                <td style="background:#f8f9fb;padding:25px;text-align:center;color:#888;font-size:13px;">
                <p style="margin:0;">© 2026 Quiz Application</p>
                <p style="margin-top:8px;">Happy Learning 📚</p>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </body>
                </html>
                """;

        // Inject the generated link safely using standard sequence replacement
        String html = htmlTemplate.replace("{{VERIFICATION_LINK}}", verificationLink);

        try {
            // 1. Define Sender Email and Name
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName("Quiz Application Support");

            // 2. Define Recipient(s)
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(to);

            // 3. Define Reply-To Configuration (Anti-Spam Optimization)
            SendSmtpEmailReplyTo replyTo = new SendSmtpEmailReplyTo();
            replyTo.setEmail(fromEmail);
            replyTo.setName("Quiz Application");

            // 4. Assemble the HTTP Request Payload
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setSender(sender);
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            sendSmtpEmail.setReplyTo(replyTo);
            sendSmtpEmail.setSubject("Verify Your Quiz Application Account");
            sendSmtpEmail.setHtmlContent(html);

            // 5. Fire the HTTP POST request to Brevo
            CreateSmtpEmail response = apiInstance.sendTransacEmail(sendSmtpEmail);
            System.out.println("Email sent successfully via HTTP API. Message ID: " + response.getMessageId());

        } catch (Exception e) {
            System.err.println("Failed to send email via Brevo HTTP API:");
            e.printStackTrace();
        }
    }
}