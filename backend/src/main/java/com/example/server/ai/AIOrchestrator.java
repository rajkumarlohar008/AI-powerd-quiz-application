package com.example.server.ai;
import com.example.server.customexception.AIException;
import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AIOrchestrator {

    private final AIServiceFactory factory;

    @Value("${ai.primary}")
    private String primaryProvider;

    public AIOrchestrator(AIServiceFactory factory) {
        this.factory = factory;
    }

    public AiQuizResponse generateQuiz(String text) throws Exception {

        AIProvider[] providers = getProviderOrder();

        Exception lastException = null;

        for (AIProvider provider : providers) {
            try {
                System.out.println("Trying " + provider);
                return factory.getProvider(provider).generateQuiz(text);

            } catch (Exception ex) {

                lastException = ex;

                System.out.println(provider + " failed : " + ex.getMessage());
            }
        }

        throw new AIException(
                "All AI providers are unavailable.",
                lastException
        );
    }

    public QuizSummaryResponse generateSummary(QuizSummaryRequest request) throws Exception {

        AIProvider[] providers = getProviderOrder();

        Exception lastException = null;

        for (AIProvider provider : providers) {
            try {
                System.out.println("Trying " + provider);
                return factory.getProvider(provider).generateSummary(request);

            } catch (Exception ex) {

                lastException = ex;

                System.out.println(provider + " failed : " + ex.getMessage());
            }
        }

        throw new AIException(
                "All AI providers are unavailable.",
                lastException
        );
    }

    private AIProvider[] getProviderOrder() {

        switch (primaryProvider.toLowerCase()) {

            case "groq":
                return new AIProvider[]{
                        AIProvider.GROQ,
                        AIProvider.OPENROUTER,
                        AIProvider.GEMINI
                };

            case "gemini":
                return new AIProvider[]{
                        AIProvider.GEMINI,
                        AIProvider.GROQ,
                        AIProvider.OPENROUTER
                };

            case "openrouter":
            default:
                return new AIProvider[]{
                        AIProvider.OPENROUTER,
                        AIProvider.GROQ,
                        AIProvider.GEMINI
                };
        }
    }
}