package com.example.server.ai;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class AIServiceFactory {

    private final AIService groq;

    private final AIService openRouter;
    private final AIService gemini;


    public AIServiceFactory(
            @Qualifier("groq") AIService groq,
            @Qualifier("openrouter") AIService openRouter,
            @Qualifier("gemini") AIService gemini) {
        this.groq = groq;
        this.openRouter = openRouter;
        this.gemini = gemini;
    }

    public AIService getProvider(AIProvider provider) {

        return switch (provider) {

            case GROQ -> groq;

            case OPENROUTER -> openRouter;

            case GEMINI -> gemini;
        };
    }

}