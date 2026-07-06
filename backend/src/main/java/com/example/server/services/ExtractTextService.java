package com.example.server.services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class ExtractTextService {
    public String extractTextFromFile(MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            return "";
        }

        String contentType = file.getContentType();

        // PDF Support
        if ("application/pdf".equalsIgnoreCase(contentType)) {

            try (PDDocument document = Loader.loadPDF(file.getBytes())) {

                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }

        // Text File Support
        if (contentType != null && contentType.startsWith("text/")) {

            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        throw new IOException("Unsupported file type: " + contentType);
    }
}
