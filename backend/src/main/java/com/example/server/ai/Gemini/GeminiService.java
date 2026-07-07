package com.example.server.ai.Gemini;

import com.example.server.ai.AIService;
import com.example.server.quiz.AiQuizQuestion;
import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service("gemini")
public class GeminiService implements AIService {

    private final String apiKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiService(@Value("${gemini.api.key:}") String apiKey, ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    public AiQuizResponse generateQuiz(String combinedText) throws IOException, InterruptedException {

        validateApiKey();

        String prompt = """
                You are an expert tutor.
                Read the following study material and create a quiz.
                
                Return exactly 10 questions.
                
                 Schema:
                 {
                  "questions":[
                    {
                      "question":"",
                      "options":["","","",""],
                      "answerIndex":0,
                      "topic":"",
                      "explanation":""
                    }
                  ]
                 }
                
                 Return only JSON.
                
                Study material:
                """ + combinedText;

        ObjectNode body = buildGeminiRequest(prompt);

        HttpRequest request = HttpRequest.newBuilder().uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey)).header("Content-Type", MediaType.APPLICATION_JSON_VALUE).POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body))).build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {

            throw new IOException("Gemini API error: " + response.statusCode() + " - " + response.body());
        }

        String text = extractTextFromGemini(response.body());

        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {
        });

        List<AiQuizQuestion> questions = objectMapper.convertValue(parsed.get("questions"), new TypeReference<List<AiQuizQuestion>>() {
        });

        return new AiQuizResponse(questions);
    }

    public QuizSummaryResponse generateSummary(QuizSummaryRequest request) throws IOException, InterruptedException {

        validateApiKey();

        Map<String, QuizSummaryResponse.TopicStats> perTopic = new HashMap<>();

        List<AiQuizQuestion> questions = request.getQuestions();

        List<Integer> userAnswers = request.getUserAnswers();

        for (int i = 0; i < questions.size(); i++) {

            AiQuizQuestion q = questions.get(i);

            String topic = q.getTopic() != null ? q.getTopic() : "General";

            perTopic.computeIfAbsent(topic, t -> new QuizSummaryResponse.TopicStats());

            QuizSummaryResponse.TopicStats stats = perTopic.get(topic);

            stats.setTotal(stats.getTotal() + 1);

            if (i < userAnswers.size() && userAnswers.get(i) != null && userAnswers.get(i).equals(q.getAnswerIndex())) {

                stats.setCorrect(stats.getCorrect() + 1);
            }
        }

        String prompt = """
                You are an expert tutor.
                
                A student completed a quiz.
                
                Data:
                """ + objectMapper.writeValueAsString(request) + """
                
                Tasks:
                1. Determine strong, medium and weak topics.
                2. Write an overall summary.
                3. Give review recommendations.
                
                Return ONLY this JSON format.
                
                {
                  "overallSummary": "string",
                  "recommendations": [
                    "string",
                    "string"
                  ]
                }
                
                Do not write markdown.
                Do not write explanations.
                Return only the JSON object.
                """;

        ObjectNode body = buildGeminiRequest(prompt);

        HttpRequest httpRequest = HttpRequest.newBuilder().uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey)).header("Content-Type", MediaType.APPLICATION_JSON_VALUE).POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body))).build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {

            throw new IOException("Gemini API error: " + response.statusCode() + " - " + response.body());
        }

        String text = extractTextFromGemini(response.body());

        text = text.replace("```json", "")
                .replace("```", "")
                .trim();

        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {
        });

        QuizSummaryResponse summary = new QuizSummaryResponse();

        summary.setPerTopic(perTopic);

        summary.setOverallSummary((String) parsed.get("overallSummary"));


        summary.setRecommendations(objectMapper.convertValue(parsed.get("recommendations"), new TypeReference<List<String>>() {
        }));

        return summary;
    }

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

    private String extractTextFromGemini(String responseBody) throws IOException {

        JsonNode root = objectMapper.readTree(responseBody);

        JsonNode candidates = root.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {

            throw new IOException("No candidates returned from Gemini.");
        }

        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();

        text = text.trim();

        if (text.startsWith("```")) {

            text = text.replaceAll("```json", "").replaceAll("```", "").trim();
        }

        return text;
    }
}
