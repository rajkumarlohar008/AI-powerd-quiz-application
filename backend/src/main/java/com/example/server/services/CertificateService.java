package com.example.server.services;

import com.example.server.dto.RoomResponseRequest;
import com.example.server.model.User;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class CertificateService {

    private static final Color NAVY = new Color(15, 40, 90);
    private static final Color GOLD = new Color(201, 162, 39);
    private static final Color PURPLE = new Color(109, 40, 217);
    private static final Color GREY = new Color(90, 100, 120);
    private static final Color LIGHT_BADGE = new Color(232, 236, 250);
    private static final Color CORNER_BLUE = new Color(37, 99, 235);
    private static final Color CORNER_PURPLE = new Color(124, 58, 237);

    public byte[] generateCertificate(
            String participantName,
            String quizRoomName,
            RoomResponseRequest response,
            User admin
    ) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDFont latoRegular = loadFont(document, "fonts/Lato-Regular.ttf");
            PDFont latoBold = loadFont(document, "fonts/Lato-Bold.ttf");
            PDFont serifBold = loadFont(document, "fonts/DejaVuSerif-Bold.ttf");
            PDFont script = loadFont(document, "fonts/GreatVibes-Regular.ttf");

            float pageW = page.getMediaBox().getWidth();
            float pageH = page.getMediaBox().getHeight();
            float margin = 28f;

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Outer navy border
                cs.setStrokingColor(NAVY);
                cs.setLineWidth(3.5f);
                cs.addRect(margin, margin, pageW - 2 * margin, pageH - 2 * margin);
                cs.stroke();

                // Inner gold border
                cs.setStrokingColor(GOLD);
                cs.setLineWidth(1.2f);
                float inner = margin + 8;
                cs.addRect(inner, inner, pageW - 2 * inner, pageH - 2 * inner);
                cs.stroke();

                drawCornerAccents(cs, pageW, pageH, margin);

                // Brand logo (top-left)
                float logoX = margin + 28;
                float logoY = pageH - margin - 72;
                drawAppLogo(document, cs, logoX, logoY);

                cs.setNonStrokingColor(NAVY);
                cs.beginText();
                cs.setFont(latoBold, 13);
                cs.newLineAtOffset(logoX + 48, logoY + 28);
                cs.showText("AI Powered");
                cs.endText();

                cs.beginText();
                cs.setFont(latoRegular, 10);
                cs.newLineAtOffset(logoX + 48, logoY + 14);
                cs.showText("Quiz Application");
                cs.endText();

                // Admin profile (top-right)
                String adminName = admin != null && admin.getName() != null ? admin.getName() : "Admin";
                String adminRole = "System Administrator";
                float adminBlockRight = pageW - margin - 28;
                float adminTextWidth = Math.max(
                        textWidth(latoBold, 12, adminName),
                        textWidth(latoRegular, 8, adminRole)
                );
                float avatarSize = 36;
                float avatarX = adminBlockRight - adminTextWidth - avatarSize - 10;
                float avatarY = logoY + 6;

                drawAdminAvatar(document, cs, admin, avatarX, avatarY, avatarSize, latoBold);

                cs.setNonStrokingColor(NAVY);
                cs.beginText();
                cs.setFont(latoBold, 12);
                cs.newLineAtOffset(avatarX + avatarSize + 10, avatarY + 20);
                cs.showText(safe(adminName));
                cs.endText();

                cs.setNonStrokingColor(GREY);
                cs.beginText();
                cs.setFont(latoRegular, 8);
                cs.newLineAtOffset(avatarX + avatarSize + 10, avatarY + 8);
                cs.showText(adminRole);
                cs.endText();

                // Center title
                float centerY = pageH * 0.72f;
                drawCenteredWithLines(cs, latoBold, 11, "CERTIFICATE OF", pageW, centerY, GOLD, NAVY);

                cs.setNonStrokingColor(NAVY);
                drawCentered(cs, serifBold, 42, "COMPLETION", pageW, centerY - 48);

                cs.setNonStrokingColor(GREY);
                drawCentered(cs, latoRegular, 11, "This is to certify that", pageW, centerY - 80);

                cs.setNonStrokingColor(NAVY);
                String name = safe(participantName);
                float nameSize = name.length() > 28 ? 28f : 36f;
                drawCentered(cs, script, nameSize, name, pageW, centerY - 125);

                // Gold diamond divider
                float divY = centerY - 145;
                cs.setStrokingColor(GOLD);
                cs.setLineWidth(1f);
                float midX = pageW / 2;
                cs.moveTo(midX - 90, divY);
                cs.lineTo(midX - 12, divY);
                cs.moveTo(midX + 12, divY);
                cs.lineTo(midX + 90, divY);
                cs.stroke();
                drawDiamond(cs, midX, divY, 5, GOLD);

                cs.setNonStrokingColor(GREY);
                drawCentered(cs, latoRegular, 11, "has successfully completed the quiz", pageW, divY - 28);

                cs.setNonStrokingColor(PURPLE);
                String quizName = safe(quizRoomName);
                float quizSize = quizName.length() > 32 ? 18f : 24f;
                drawCentered(cs, latoBold, quizSize, quizName, pageW, divY - 58);

                // Score badge
                int correct = response != null ? response.getCorrect() : 0;
                int total = response != null ? response.getTotal() : 0;
                double pct = response != null ? response.getPercentage() : 0;
                String marks = String.format(Locale.US, "Marks obtained: %d / %d (%.0f%%)", correct, total, pct);
                drawScoreBadge(cs, latoBold, marks, pageW, divY - 100);

                // Footer
                float footerY = margin + 55;
                String issueDate = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH));

                cs.setNonStrokingColor(NAVY);
                cs.beginText();
                cs.setFont(latoRegular, 8);
                cs.newLineAtOffset(margin + 36, footerY + 14);
                cs.showText("Date of Issue");
                cs.endText();

                cs.beginText();
                cs.setFont(latoBold, 11);
                cs.newLineAtOffset(margin + 36, footerY);
                cs.showText(issueDate);
                cs.endText();

                // Center tagline
                cs.setNonStrokingColor(GREY);
                drawCentered(cs, latoRegular, 9, "Learn  •  Practice  •  Grow", pageW, footerY + 12);
                drawCentered(cs, latoRegular, 7, "AI Powered Quiz Application", pageW, footerY - 2);

                // Signature / issued by
                String issuer = safe(adminName);
                float sigX = pageW - margin - 150;
                cs.setNonStrokingColor(new Color(30, 64, 175));
                drawText(cs, script, 18, issuer.length() > 18 ? issuer.substring(0, 18) : issuer, sigX, footerY + 22);

                cs.setStrokingColor(new Color(30, 64, 175));
                cs.setLineWidth(1f);
                cs.moveTo(sigX, footerY + 16);
                cs.lineTo(sigX + 120, footerY + 16);
                cs.stroke();

                cs.setNonStrokingColor(GREY);
                drawText(cs, latoRegular, 8, "Issued by", sigX, footerY + 4);

                cs.setNonStrokingColor(NAVY);
                drawText(cs, latoBold, 10, issuer, sigX, footerY - 10);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    private void drawCornerAccents(PDPageContentStream cs, float pageW, float pageH, float margin) throws IOException {
        float size = 70;

        // Top-right
        cs.setNonStrokingColor(CORNER_BLUE);
        cs.moveTo(pageW - margin, pageH - margin);
        cs.lineTo(pageW - margin - size, pageH - margin);
        cs.lineTo(pageW - margin, pageH - margin - size);
        cs.closePath();
        cs.fill();

        cs.setNonStrokingColor(CORNER_PURPLE);
        cs.moveTo(pageW - margin, pageH - margin);
        cs.lineTo(pageW - margin - size * 0.55f, pageH - margin);
        cs.lineTo(pageW - margin, pageH - margin - size * 0.55f);
        cs.closePath();
        cs.fill();

        // Bottom-left
        cs.setNonStrokingColor(CORNER_BLUE);
        cs.moveTo(margin, margin);
        cs.lineTo(margin + size, margin);
        cs.lineTo(margin, margin + size);
        cs.closePath();
        cs.fill();

        cs.setNonStrokingColor(CORNER_PURPLE);
        cs.moveTo(margin, margin);
        cs.lineTo(margin + size * 0.55f, margin);
        cs.lineTo(margin, margin + size * 0.55f);
        cs.closePath();
        cs.fill();
    }

    private void drawAppLogo(PDDocument document, PDPageContentStream cs, float x, float y) throws IOException {
        try {
            ClassPathResource logo = new ClassPathResource("images/app-logo.png");
            if (logo.exists()) {
                try (InputStream in = logo.getInputStream()) {
                    PDImageXObject img = PDImageXObject.createFromByteArray(document, in.readAllBytes(), "logo");
                    cs.drawImage(img, x, y, 40, 40);
                    return;
                }
            }
        } catch (Exception ignored) {
            // fall through to drawn fallback
        }
        // Orange rounded square + bolt fallback
        cs.setNonStrokingColor(new Color(249, 115, 22));
        cs.addRect(x, y, 40, 40);
        cs.fill();
        cs.setNonStrokingColor(Color.WHITE);
        cs.setLineWidth(2.5f);
        cs.moveTo(x + 22, y + 32);
        cs.lineTo(x + 14, y + 18);
        cs.lineTo(x + 20, y + 18);
        cs.lineTo(x + 16, y + 8);
        cs.lineTo(x + 28, y + 20);
        cs.lineTo(x + 22, y + 20);
        cs.closePath();
        cs.fill();
    }

    private void drawAdminAvatar(PDDocument document, PDPageContentStream cs, User admin,
                                 float x, float y, float size, PDFont font) throws IOException {
        boolean drawn = false;
        if (admin != null && admin.getImageURL() != null && !admin.getImageURL().isBlank()) {
            try (InputStream in = URI.create(admin.getImageURL()).toURL().openStream()) {
                byte[] bytes = in.readAllBytes();
                PDImageXObject img = PDImageXObject.createFromByteArray(document, bytes, "admin");
                cs.drawImage(img, x, y, size, size);
                drawn = true;
            } catch (Exception ignored) {
                drawn = false;
            }
        }
        if (!drawn) {
            cs.setNonStrokingColor(new Color(30, 58, 138));
            cs.addRect(x, y, size, size);
            cs.fill();
            cs.setNonStrokingColor(Color.WHITE);
            String initial = admin != null && admin.getName() != null && !admin.getName().isBlank()
                    ? admin.getName().substring(0, 1).toUpperCase(Locale.ENGLISH)
                    : "A";
            cs.beginText();
            cs.setFont(font, 14);
            cs.newLineAtOffset(x + size / 2 - 4, y + size / 2 - 5);
            cs.showText(initial);
            cs.endText();
        }
    }

    private void drawScoreBadge(PDPageContentStream cs, PDFont font, String text, float pageW, float y) throws IOException {
        float textW = textWidth(font, 11, text);
        float badgeW = textW + 70;
        float badgeH = 28;
        float badgeX = (pageW - badgeW) / 2;

        cs.setNonStrokingColor(LIGHT_BADGE);
        fillRoundRect(cs, badgeX, y, badgeW, badgeH, 14);

        // Trophy diamond
        cs.setNonStrokingColor(PURPLE);
        drawDiamond(cs, badgeX + 18, y + badgeH / 2, 6, PURPLE);

        cs.setStrokingColor(new Color(180, 190, 220));
        cs.setLineWidth(0.8f);
        cs.moveTo(badgeX + 34, y + 6);
        cs.lineTo(badgeX + 34, y + badgeH - 6);
        cs.stroke();

        cs.setNonStrokingColor(NAVY);
        drawText(cs, font, 11, text, badgeX + 42, y + 9);
    }

    private void fillRoundRect(PDPageContentStream cs, float x, float y, float w, float h, float r) throws IOException {
        // Approximate rounded rect with a filled rectangle (PDFBox has no native roundRect fill helper)
        cs.addRect(x, y, w, h);
        cs.fill();
        // Soften corners visually with overlapping circles approximation is skipped for simplicity
    }

    private void drawDiamond(PDPageContentStream cs, float cx, float cy, float size, Color color) throws IOException {
        cs.setNonStrokingColor(color);
        cs.moveTo(cx, cy + size);
        cs.lineTo(cx + size, cy);
        cs.lineTo(cx, cy - size);
        cs.lineTo(cx - size, cy);
        cs.closePath();
        cs.fill();
    }

    private void drawCenteredWithLines(PDPageContentStream cs, PDFont font, float size, String text,
                                       float pageW, float y, Color lineColor, Color textColor) throws IOException {
        float tw = textWidth(font, size, text);
        float tx = (pageW - tw) / 2;
        cs.setStrokingColor(lineColor);
        cs.setLineWidth(1f);
        cs.moveTo(tx - 70, y + 4);
        cs.lineTo(tx - 12, y + 4);
        cs.moveTo(tx + tw + 12, y + 4);
        cs.lineTo(tx + tw + 70, y + 4);
        cs.stroke();
        cs.setNonStrokingColor(textColor);
        drawText(cs, font, size, text, tx, y);
    }

    private void drawCentered(PDPageContentStream cs, PDFont font, float size, String text, float pageW, float y) throws IOException {
        float tw = textWidth(font, size, text);
        drawText(cs, font, size, text, (pageW - tw) / 2, y);
    }

    private void drawText(PDPageContentStream cs, PDFont font, float size, String text, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(safe(text));
        cs.endText();
    }

    private float textWidth(PDFont font, float size, String text) throws IOException {
        return font.getStringWidth(safe(text)) / 1000f * size;
    }

    private PDFont loadFont(PDDocument document, String path) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return PDType0Font.load(document, in);
        }
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        // PDF fonts may not include every unicode glyph; strip unsupported control chars
        return value.replaceAll("[\\r\\n\\t]", " ").trim();
    }
}
