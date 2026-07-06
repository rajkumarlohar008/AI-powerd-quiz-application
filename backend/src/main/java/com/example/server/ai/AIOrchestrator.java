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

    public AiQuizResponse generateQuiz(String text)
            throws Exception {
        if (primaryProvider.equalsIgnoreCase("groq")) {
            try {

                return factory
                        .getProvider(AIProvider.GROQ)
                        .generateQuiz(text);

            } catch (Exception ex) {

                System.out.println("Groq failed");
                try {
                    return factory
                            .getProvider(AIProvider.OPENROUTER)
                            .generateQuiz(text);
                } catch (Exception e) {
                    throw new AIException(
                            "Both AI providers are unavailable."
                    );
                }
            }
        } else {
            try {

                return factory
                        .getProvider(AIProvider.OPENROUTER)
                        .generateQuiz(text);

            } catch (Exception ex) {

                System.out.println("OpenRoute failed");
                try {
                    return factory
                            .getProvider(AIProvider.GROQ)
                            .generateQuiz(text);
                } catch (Exception e) {
                    throw new AIException(
                            "Both AI providers are unavailable."
                    );
                }
            }
        }

    }

    public QuizSummaryResponse generateSummary(QuizSummaryRequest request)
            throws Exception {

        if (primaryProvider.equalsIgnoreCase("groq")) {
            try {

                return factory
                        .getProvider(AIProvider.GROQ)
                        .generateSummary(request);

            } catch (Exception ex) {

                System.out.println("Groq failed");
                try {
                    return factory
                            .getProvider(AIProvider.OPENROUTER)
                            .generateSummary(request);
                } catch (Exception e) {
                    throw new AIException(
                            "Both AI providers are unavailable."
                    );
                }
            }
        } else {
            try {

                    return factory
                            .getProvider(AIProvider.OPENROUTER)
                            .generateSummary(request);

            } catch (Exception ex) {

                System.out.println("OpenRoute failed");
                try {
                    return factory
                            .getProvider(AIProvider.GROQ)
                            .generateSummary(request);
                }catch (Exception e){
                    throw new AIException(
                            "Both AI providers are unavailable."
                    );
                }
            }
        }
    }

}
