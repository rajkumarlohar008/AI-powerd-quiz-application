package com.example.server.ai.openrouter;

import com.example.server.ai.AIService;
import com.example.server.customexception.AIException;
import com.example.server.customexception.AIServiceUnavailableException;
import com.example.server.customexception.RateLimitException;
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

@Service("openrouter")
public class OpenRouterService implements AIService {

    private final String apiKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String model;

    public OpenRouterService(@Value("${openrouter.api.key:}") String apiKey, ObjectMapper objectMapper,@Value("${openrouter.model}") String model) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.model = model;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public AiQuizResponse generateQuiz(String combinedText) throws Exception {
        validateApiKey();

        String prompt = """
                You are an expert tutor.
                Read the following study material detect language and in this language  and create a quiz.
                
                - Generate 10 multiple-choice questions.
                - Each question must contain:
                  - "question": string
                  - "options": array of 4 strings
                  - "answerIndex": correct option index (0-3)
                  - "topic": short topic name
                  - "explanation": short explanation
                
                Return ONLY valid JSON matching this schema:
                {
                  "questions":[
                    {
                      "question":"...",
                      "options":["...","...","...","..."],
                      "answerIndex":0,
                      "topic":"...",
                      "explanation":"..."
                    }
                  ]
                }
                
                Study material:
                """ + combinedText;

        // Choose your preferred OpenRouter fallback model here
        ObjectNode body = buildOpenAiCompatibleRequest(model, prompt, true);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://openrouter.ai/api/v1/chat/completions"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        switch (response.statusCode()) {

            case 200:
                break;

            case 429:
                throw new RateLimitException("OpenRoute rate limit exceeded.");

            case 500:
            case 502:
            case 503:
            case 504:
                throw new AIServiceUnavailableException(
                        "OpenRoute is temporarily unavailable.");

            default:
                throw new AIException(response.body());
        }

        String text = extractTextFromOpenAiResponse(response.body());
        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {});
        List<AiQuizQuestion> questions = objectMapper.convertValue(parsed.get("questions"), new TypeReference<List<AiQuizQuestion>>() {});

        return new AiQuizResponse(questions);
    }

    @Override
    public QuizSummaryResponse generateSummary(QuizSummaryRequest request) throws Exception {
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
                4.detect language of data and give response in that language.
                
                Return ONLY this JSON format. Do not include markdown code blocks.
                {
                  "overallSummary": "string",
                  "recommendations": [
                    "string",
                    "string"
                  ]
                }
                """;

        ObjectNode body = buildOpenAiCompatibleRequest("google/gemini-2.5-flash", prompt, true);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        switch (response.statusCode()) {

            case 200:
                break;

            case 429:
                throw new RateLimitException("OpenRoute rate limit exceeded.");

            case 500:
            case 502:
            case 503:
            case 504:
                throw new AIServiceUnavailableException(
                        "OpenRoute is temporarily unavailable.");

            default:
                throw new AIException(response.body());
        }

        String text = extractTextFromOpenAiResponse(response.body());
        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {});

        return new QuizSummaryResponse(perTopic,(String) parsed.get("overallSummary"),objectMapper.convertValue(parsed.get("recommendations"), new TypeReference<List<String>>() {}));
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenRouter API key is not configured.");
        }
    }

    private ObjectNode buildOpenAiCompatibleRequest(String model, String prompt, boolean forceJson) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);

        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");
        message.put("content", prompt);

        if (forceJson) {
            ObjectNode responseFormat = body.putObject("response_format");
            responseFormat.put("type", "json_object");
        }

        return body;
    }

    private String extractTextFromOpenAiResponse(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");

        if (!choices.isArray() || choices.isEmpty()) {
            throw new IOException("No choices returned from the API.");
        }

        String text = choices.get(0).path("message").path("content").asText().trim();

        if (text.startsWith("```")) {
            text = text.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        return text;
    }
}