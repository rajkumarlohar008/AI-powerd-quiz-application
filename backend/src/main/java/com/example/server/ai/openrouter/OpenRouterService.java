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

    public OpenRouterService(@Value("${openrouter.api.key:}") String apiKey,
                             ObjectMapper objectMapper,
                             @Value("${openrouter.model}") String model) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.model = model;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public AiQuizResponse generateQuiz(String combinedText) throws Exception {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return executeGenerateQuiz(combinedText);
            } catch (AIException e) {
                if (attempt == 2) {
                    throw e;
                }
                System.out.println("Retrying OpenRouter quiz generation (Attempt " + attempt + " failed)...");
            }
        }
        throw new AIException("OpenRouter failed to generate a valid quiz after retries.");
    }

    private AiQuizResponse executeGenerateQuiz(String combinedText) throws Exception {
        validateApiKey();

        String prompt = """
                You are an expert tutor.
                
                Read the study material carefully.
                
                Generate EXACTLY 10 multiple choice questions.
                
                Each question MUST have:
                - question
                - options (exactly 4)
                - answerIndex
                - topic
                - explanation
                
                IMPORTANT:
                
                Return ONLY valid JSON.
                
                Do NOT write markdown.
                
                Do NOT write ```json.
                
                Do NOT write any explanation.
                
                Do NOT write any text before or after the JSON.
                
                Your response MUST start with {
                
                and MUST end with }
                
                If you cannot generate the quiz, return
                
                {
                  "questions":[]
                }
                
                Study material:
                
                """ + combinedText;

        ObjectNode body = buildOpenAiCompatibleRequest(model, prompt);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://openrouter.ai/api/v1/chat/completions"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorStatusCodes(response);

        String text = extractTextFromOpenAiResponse(response.body());
        JsonNode root = parseJson(text);

        if (root.isNull()) {
            throw new AIException("OpenRouter returned null.");
        }

        if (!root.has("questions")) {
            System.out.println("Missing 'questions' node. Raw content:\n" + text);
            throw new AIException("OpenRouter returned an unexpected response structure missing 'questions'.");
        }

        List<AiQuizQuestion> questions = objectMapper.convertValue(
                root.get("questions"),
                new TypeReference<List<AiQuizQuestion>>() {}
        );

        if (questions == null || questions.size() != 10) {
            throw new AIException("OpenRouter generated an invalid quiz size. Expected exactly 10, got: "
                    + (questions == null ? 0 : questions.size()));
        }

        return new AiQuizResponse(questions);
    }

    @Override
    public QuizSummaryResponse generateSummary(QuizSummaryRequest request) throws Exception {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return executeGenerateSummary(request);
            } catch (AIException e) {
                if (attempt == 2) {
                    throw e;
                }
                System.out.println("Retrying OpenRouter summary generation (Attempt " + attempt + " failed)...");
            }
        }
        throw new AIException("OpenRouter failed to generate a valid summary after retries.");
    }

    private QuizSummaryResponse executeGenerateSummary(QuizSummaryRequest request) throws Exception {
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
                4. detect language of data and give response in that language.
                
                Return ONLY this JSON format. Do not include markdown code blocks.
                {
                  "overallSummary": "string",
                  "recommendations": [
                    "string",
                    "string"
                  ]
                }
                """;

        ObjectNode body = buildOpenAiCompatibleRequest(model, prompt);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://openrouter.ai/api/v1/chat/completions"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofByteArray(objectMapper.writeValueAsBytes(body)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        handleErrorStatusCodes(response);

        String text = extractTextFromOpenAiResponse(response.body());
        JsonNode root = parseJson(text);

        if (root.isNull()) {
            throw new AIException("OpenRouter returned null summary.");
        }

        String overallSummary = root.has("overallSummary") ? root.get("overallSummary").asText("") : "";
        List<String> recommendations = objectMapper.convertValue(
                root.get("recommendations"),
                new TypeReference<List<String>>() {}
        );

        return new QuizSummaryResponse(perTopic, overallSummary, recommendations);
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenRouter API key is not configured.");
        }
    }

    private ObjectNode buildOpenAiCompatibleRequest(String model, String prompt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", 3000);

        ArrayNode messages = body.putArray("messages");
        ObjectNode msg = messages.addObject();
        msg.put("role", "user");
        msg.put("content", prompt);

        // Only enable json_object for models that support it
        if (!model.startsWith("tencent/")) {
            ObjectNode format = body.putObject("response_format");
            format.put("type", "json_object");
        }

        return body;
    }

    private String extractTextFromOpenAiResponse(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");

        if (!choices.isArray() || choices.isEmpty()) {
            throw new AIException("OpenRouter returned no choices.\n" + responseBody);
        }

        String text = choices.get(0)
                .path("message")
                .path("content")
                .asText("");

        text = text.trim();

        if (text.startsWith("```")) {
            text = text.replace("```json", "")
                    .replace("```", "")
                    .trim();
        }

        return text;
    }

    private JsonNode parseJson(String text) {
        try {
            return objectMapper.readTree(text);
        } catch (Exception e) {
            System.out.println("========== INVALID JSON ==========");
            System.out.println(text);
            System.out.println("=================================");
            throw new AIException("Invalid JSON returned by OpenRouter.");
        }
    }

    private void handleErrorStatusCodes(HttpResponse<String> response) {
        switch (response.statusCode()) {
            case 200:
                break;
            case 429:
                System.out.println("Status : " + response.statusCode() + " | Response : " + response.body());
                throw new RateLimitException("OpenRouter rate limit exceeded.");
            case 500:
            case 502:
            case 503:
            case 504:
                System.out.println("Status : " + response.statusCode() + " | Response : " + response.body());
                throw new AIServiceUnavailableException("OpenRouter is temporarily unavailable.");
            default:
                throw new AIException("Unexpected status code from OpenRouter: " + response.statusCode() + "\n" + response.body());
        }
    }
}