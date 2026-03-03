package com.example.server.quiz;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final String apiKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiService(@Value("${gemini.api.key:}") String apiKey,
                         ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    // ==============================
    // FILE TEXT EXTRACTION
    // ==============================
    public String extractTextFromFile(MultipartFile file) throws IOException {
        if (file == null) {
            return "";
        }

        String contentType = file.getContentType();

        if ("application/pdf".equalsIgnoreCase(contentType)) {
            try (InputStream in = file.getInputStream();
                 PDDocument document = PDDocument.load(in)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }

        if (contentType != null && contentType.startsWith("text/")) {
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        throw new IOException("Unsupported file type: " + contentType);
    }

    // ==============================
    // GENERATE QUIZ
    // ==============================
    public AiQuizResponse generateQuiz(String combinedText)
            throws IOException, InterruptedException {

        validateApiKey();

        String prompt = """
                You are an expert tutor.
                Read the following study material and create a quiz.
                - Generate 10 multiple-choice questions.
                - Each question must have:
                  - "question": string
                  - "options": array of 4 strings
                  - "answerIndex": index (0-3) of correct option
                  - "topic": short topic name
                  - "explanation": 1–3 sentence explanation.
                - Return ONLY valid JSON:
                {
                  "questions": [
                    {
                      "question": "...",
                      "options": ["...", "...", "...", "..."],
                      "answerIndex": 0,
                      "topic": "...",
                      "explanation": "..."
                    }
                  ]
                }

                Study material:
                """ + combinedText;

        ObjectNode body = buildGeminiRequest(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofByteArray(
                        objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new IOException("Gemini API error: "
                    + response.statusCode() + " - " + response.body());
        }

        String text = extractTextFromGemini(response.body());

        Map<String, Object> parsed =
                objectMapper.readValue(text, new TypeReference<>() {});

        @SuppressWarnings("unchecked")
        List<AiQuizQuestion> questions =
                objectMapper.convertValue(parsed.get("questions"),
                        new TypeReference<List<AiQuizQuestion>>() {});

        return new AiQuizResponse(questions);
    }

    // ==============================
    // GENERATE SUMMARY
    // ==============================
    public QuizSummaryResponse generateSummary(QuizSummaryRequest request)
            throws IOException, InterruptedException {

        validateApiKey();

        Map<String, QuizSummaryResponse.TopicStats> perTopic = new HashMap<>();
        List<AiQuizQuestion> questions = request.getQuestions();
        List<Integer> userAnswers = request.getUserAnswers();

        for (int i = 0; i < questions.size(); i++) {
            AiQuizQuestion q = questions.get(i);
            String topic = q.getTopic() != null ? q.getTopic() : "General";

            perTopic.computeIfAbsent(topic,
                    t -> new QuizSummaryResponse.TopicStats());

            QuizSummaryResponse.TopicStats stats = perTopic.get(topic);
            stats.setTotal(stats.getTotal() + 1);

            if (i < userAnswers.size()
                    && userAnswers.get(i) != null
                    && userAnswers.get(i).equals(q.getAnswerIndex())) {
                stats.setCorrect(stats.getCorrect() + 1);
            }
        }

        String prompt = """
                You are an expert tutor.
                A student completed a quiz.

                Data:
                """ + objectMapper.writeValueAsString(request) + """

                Tasks:
                1. For each topic say strong, medium, or weak.
                2. Write 3–5 sentence overall summary.
                3. Give review recommendations.

                Return ONLY valid JSON:
                {
                  "overallSummary": "...",
                  "topics": [
                    { "topic": "...", "strength": "...", "correct": 0, "total": 0 }
                  ],
                  "recommendations": ["...", "..."]
                }
                """;

        ObjectNode body = buildGeminiRequest(prompt);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofByteArray(
                        objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response =
                httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new IOException("Gemini API error: "
                    + response.statusCode() + " - " + response.body());
        }

        String text = extractTextFromGemini(response.body());

        Map<String, Object> parsed =
                objectMapper.readValue(text, new TypeReference<>() {});

        QuizSummaryResponse summary = new QuizSummaryResponse();
        summary.setPerTopic(perTopic);
        summary.setOverallSummary((String) parsed.get("overallSummary"));

        summary.setTopics(objectMapper.convertValue(
                parsed.get("topics"),
                new TypeReference<List<QuizTopicResult>>() {}));

        summary.setRecommendations(objectMapper.convertValue(
                parsed.get("recommendations"),
                new TypeReference<List<String>>() {}));

        return summary;
    }

    // ==============================
    // HELPER METHODS
    // ==============================

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }
    }

    private ObjectNode buildGeminiRequest(String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode contents = body.putArray("contents");

        ObjectNode contentObj = contents.addObject();
        ArrayNode parts = contentObj.putArray("parts");

        ObjectNode partObj = parts.addObject();
        partObj.put("text", prompt);

        return body;
    }

    private String extractTextFromGemini(String responseBody)
            throws IOException {

        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IOException("No candidates returned from Gemini.");
        }

        String text = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();

        // 🔥 Remove markdown code blocks if present
        text = text.trim();

        if (text.startsWith("```")) {
            text = text.replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();
        }

        return text;
    }
}