package com.example.server.ai;

import com.example.server.quiz.AiQuizResponse;
import com.example.server.quiz.QuizSummaryRequest;
import com.example.server.quiz.QuizSummaryResponse;

public interface AIService {

    AiQuizResponse generateQuiz(String combinedText)
            throws Exception;

    QuizSummaryResponse generateSummary(QuizSummaryRequest request)
            throws Exception;

}
