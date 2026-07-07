package com.example.server.ai.groq;

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

@Service("groq")
public class GroqService implements AIService {

    private final String apiKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GroqService(@Value("${groq.api.key:}") String apiKey, ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public AiQuizResponse generateQuiz(String combinedText) throws Exception {
        validateApiKey();
        if (combinedText.length() > 25000) {
            combinedText = combinedText.substring(0, 25000);
        }
        String prompt = """
                You are an expert tutor.
                Read the following study material detect language and in this language create a quiz.
                
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

        // Groq uses standard llama3 models or similar. We will use llama-3.3-70b-versatile as a strong default.
        ObjectNode body = buildOpenAiCompatibleRequest(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        switch (response.statusCode()) {

            case 200:
                break;

            case 429:
                throw new RateLimitException("Groq rate limit exceeded.");

            case 500:
            case 502:
            case 503:
            case 504:
                throw new AIServiceUnavailableException(
                        "Groq is temporarily unavailable.");

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

        // Calculate topic stats locally just like GeminiService does
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

        ObjectNode body = buildOpenAiCompatibleRequest(prompt);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        switch (response.statusCode()) {

            case 200:
                break;

            case 429:
                throw new RateLimitException("Groq rate limit exceeded.");

            case 500:
            case 502:
            case 503:
            case 504:
                throw new AIServiceUnavailableException(
                        "Groq is temporarily unavailable.");

            default:
                throw new AIException(response.body());
        }

        String text = extractTextFromOpenAiResponse(response.body());
        Map<String, Object> parsed = objectMapper.readValue(text, new TypeReference<>() {});

        return new QuizSummaryResponse(perTopic,(String) parsed.get("overallSummary"),objectMapper.convertValue(parsed.get("recommendations"), new TypeReference<List<String>>() {}));
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Groq API key is not configured.");
        }
    }

    private ObjectNode buildOpenAiCompatibleRequest(String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", "llama-3.3-70b-versatile");

        ArrayNode messages = body.putArray("messages");
        ObjectNode message = messages.addObject();
        message.put("role", "user");
        message.put("content", prompt);

        if (true) {
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