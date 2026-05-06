# Chapter 4: System Analysis Overview

## 4.1 Requirement Analysis

Requirement analysis is the foundation of successful system design. It defines what the system must do, how it should perform, and what constraints must be considered during development. For the **AI-Powered Quiz Application**, requirements were gathered from the perspective of students (primary users), project guide expectations, and technical feasibility.

The analysis was divided into hardware, software, functional, and non-functional requirements.

### 4.1.1 Hardware Requirement

The following hardware configuration is sufficient for development, testing, and demonstration of the proposed system:

| Component | Minimum Requirement | Recommended Requirement |
|---|---|---|
| Processor | Intel i3 / Ryzen 3 | Intel i5 / Ryzen 5 or above |
| RAM | 8 GB | 16 GB |
| Storage | 20 GB free disk space | SSD with 40+ GB free space |
| Display | 1366 x 768 | Full HD (1920 x 1080) |
| Internet | Required for AI API calls | Stable broadband connection |

### 4.1.2 Software Requirement

The software stack required to run the system is shown below:

| Category | Tools / Technologies |
|---|---|
| Operating System | Windows 10/11, Linux, or macOS |
| Frontend | React.js, JavaScript, CSS |
| Backend | Java 17, Spring Boot |
| Database | MongoDB |
| Build Tools | Node.js + npm, Maven |
| API Testing | Postman (optional) |
| IDE | Cursor / VS Code / IntelliJ IDEA |
| Browser | Google Chrome / Edge / Firefox |
| External Service | Gemini API (for AI quiz and summary) |

### 4.1.3 Functional & Non-Functional Requirements

#### A. Functional Requirements

The system must provide the following core functionalities:

1. **User Registration**  
   New users should be able to create an account using name, email, and password.

2. **User Login**  
   Existing users should be able to log in securely and access personalized dashboard features.

3. **Predefined Quiz Attempt**  
   Users should be able to attempt standard MCQ quizzes with navigation and timer support.

4. **AI Quiz Generation**  
   Users should be able to paste study text or upload PDF/text files and generate AI-based MCQs.

5. **Quiz Evaluation and Result Display**  
   System should calculate score, show correct/incorrect responses, and provide explanations.

6. **AI Summary Generation**  
   For AI quiz attempts, system should generate topic-wise performance analysis and recommendations.

7. **Quiz Attempt Storage**  
   User attempt details should be saved for historical review.

8. **Quiz History View**  
   Users should be able to view previous attempts and average performance.

9. **Dashboard Navigation and Session Handling**  
   System should support intuitive navigation and basic token-based session persistence.

#### B. Non-Functional Requirements

1. **Usability**  
   Interface should be simple and intuitive for student users.

2. **Performance**  
   API responses should be reasonably fast under normal load; UI interactions should remain responsive.

3. **Reliability**  
   System should handle input validation and errors without crashing.

4. **Scalability**  
   Architecture should allow future extension (e.g., admin module, adaptive quiz, analytics).

5. **Security**  
   Passwords must be encrypted; user data should be protected; APIs should be designed for secure access.

6. **Maintainability**  
   Codebase should remain modular and readable for future updates.

7. **Availability**  
   Core features should be accessible whenever backend and database services are active.

---

## 4.2 Use-Case Diagram & Use-Case Description

Use-case modeling defines how users interact with the system and what actions are supported by the application.

### 4.2.1 Primary Actor

- **Student/User**: Uses the system for registration, login, quiz attempts, AI generation, and history viewing.

### 4.2.2 External/Supporting Actor

- **Gemini API Service**: Provides AI-generated quiz and summary responses based on prompts from backend.

### 4.2.3 Major Use Cases

1. Register account  
2. Login to system  
3. Start predefined quiz  
4. Submit predefined quiz and view result  
5. Generate AI quiz from text/file  
6. Attempt AI quiz  
7. Generate AI summary/recommendations  
8. Save quiz attempt  
9. View quiz history  
10. Logout

### 4.2.4 Use-Case Descriptions

#### Use Case 1: Register
- **Actor**: Student  
- **Precondition**: User is not registered  
- **Main Flow**: Enter details -> Submit -> System validates -> Account created  
- **Postcondition**: User record stored in database

#### Use Case 2: Login
- **Actor**: Student  
- **Precondition**: Valid registered account  
- **Main Flow**: Enter credentials -> Verify -> Token issued -> Redirect to dashboard  
- **Postcondition**: Authenticated session established on client

#### Use Case 3: Attempt Predefined Quiz
- **Actor**: Student  
- **Precondition**: Logged in  
- **Main Flow**: Start quiz -> Answer questions -> Submit -> View score  
- **Postcondition**: Attempt can be saved to history

#### Use Case 4: Generate AI Quiz
- **Actor**: Student  
- **Precondition**: Logged in and input content available  
- **Main Flow**: Paste/upload content -> Request generation -> Backend calls AI -> Quiz displayed  
- **Postcondition**: AI question set ready for attempt

#### Use Case 5: Generate AI Summary
- **Actor**: Student  
- **Precondition**: AI quiz submitted  
- **Main Flow**: Answers sent -> Backend computes + requests AI summary -> Feedback shown  
- **Postcondition**: Topic-wise analysis available

#### Use Case 6: View Quiz History
- **Actor**: Student  
- **Precondition**: Logged in and attempts exist  
- **Main Flow**: Open history -> Fetch user attempts -> Display analytics  
- **Postcondition**: User reviews progress trends

### 4.2.5 Use-Case Diagram (To Insert)

Insert diagram showing:
- Actor: Student
- System boundary: AI-Powered Quiz Application
- Use cases linked to actor (Register, Login, Attempt Quiz, Generate AI Quiz, View History, Logout)
- External API interaction with AI generation and summary use cases

---

## 4.3 Sequence Diagram

Sequence diagrams explain time-ordered interactions among frontend, backend, database, and external AI service. The system contains multiple interaction sequences; two important flows are described below.

### 4.3.1 Sequence: User Authentication Flow

1. User enters email and password in Login UI.  
2. Frontend sends `POST /api/login` to backend.  
3. Backend validates credentials from MongoDB user collection.  
4. Backend generates JWT token and returns user info.  
5. Frontend stores token and user in local storage.  
6. User is redirected to dashboard.

### 4.3.2 Sequence: AI Quiz Generation and Summary Flow

1. User enters text/uploads file in AI Quiz screen.  
2. Frontend sends multipart request to `POST /api/ai/generate-quiz`.  
3. Backend extracts text from input file/content.  
4. Backend sends prompt to Gemini API for MCQ generation.  
5. Gemini API returns structured question data.  
6. Backend returns quiz questions to frontend.  
7. User attempts AI quiz and submits answers.  
8. Frontend sends responses to `POST /api/ai/quiz-summary`.  
9. Backend computes topic stats and requests AI summary.  
10. Gemini API returns overall summary and recommendations.  
11. Backend sends summary to frontend and stores attempt in MongoDB.  
12. Frontend displays result, topic insights, and recommendation list.

### 4.3.3 Sequence Diagram (To Insert)

Insert sequence diagram with lifelines:
- User
- React Frontend
- Spring Boot API
- MongoDB
- Gemini API

Include messages for login, quiz generation, summary generation, and history storage.

---

## 4.4 System Flow Diagram

System flow diagram provides an end-to-end operational view of the application from input to output.

### 4.4.1 High-Level Flow

1. **Start Application**  
   User opens web application.

2. **Authentication Step**  
   User registers or logs in.

3. **Dashboard Selection**  
   User chooses one of the following:
   - Predefined Quiz  
   - AI Quiz  
   - Quiz History

4. **Predefined Quiz Path**
   - Fetch quiz questions from backend
   - User attempts quiz
   - Score is calculated and displayed
   - Attempt can be saved

5. **AI Quiz Path**
   - User provides text/file input
   - System generates AI quiz through backend + Gemini API
   - User attempts generated quiz
   - AI summary and recommendations are displayed
   - Attempt is saved to database

6. **History Path**
   - System fetches user-specific attempt records
   - Displays performance statistics and previous scores

7. **End / Continue Learning**
   User may logout or continue attempts.

### 4.4.2 System Flow Diagram (To Insert)

Draw flowchart blocks in this order:
Start -> Login/Register -> Dashboard -> {Predefined Quiz | AI Quiz | History} -> Result/Summary -> Save Attempt -> End/Repeat

---

## Chapter Summary

This chapter presented the full system analysis of the proposed AI-Powered Quiz Application. It defined hardware/software requirements, listed functional and non-functional requirements, and described user interaction through use cases. It also documented sequence-level communication among application layers and provided a high-level system flow for complete operational understanding. This analysis acts as the blueprint for design and implementation decisions described in subsequent chapters.

