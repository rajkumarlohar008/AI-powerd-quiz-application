# Chapter 5: System Design Overview

## 5.1 Data Dictionary

The data dictionary defines the structure, meaning, and usage of important data elements used in the system. It helps maintain consistency between frontend forms, backend APIs, and MongoDB collections.

### 5.1.1 User Collection (`users`)

| Field Name | Data Type | Description | Constraints |
|---|---|---|---|
| `id` | String/ObjectId | Unique user identifier | Primary key, auto-generated |
| `name` | String | Full name of user | Required |
| `email` | String | User login email | Required, unique |
| `password` | String | Encrypted password hash | Required |
| `createdAt` | DateTime | Account creation timestamp | Auto-managed |
| `updatedAt` | DateTime | Last update timestamp | Auto-managed |

### 5.1.2 Quiz Attempt Collection (`quiz_attempts`)

| Field Name | Data Type | Description | Constraints |
|---|---|---|---|
| `id` | String/ObjectId | Unique attempt identifier | Primary key |
| `userId` | String | Reference to user | Required, indexed |
| `quizType` | String | Type of quiz (`PREDEFINED`, `AI`) | Required |
| `correct` | Integer | Number of correct answers | Required |
| `total` | Integer | Total number of questions | Required |
| `percentage` | Double | Score percentage | Required |
| `createdAt` | DateTime | Attempt submission time | Required |
| `questions` | Array<QuestionAttempt> | Detailed per-question attempt data | Optional for lightweight mode, used in this project |

### 5.1.3 Embedded Question Attempt Structure

| Field Name | Data Type | Description | Constraints |
|---|---|---|---|
| `question` | String | Question statement | Required |
| `options` | Array<String> | Options shown to user | Required |
| `correctAnswer` | Integer | Correct option index | Required |
| `userAnswer` | Integer/Null | Selected option index by user | Nullable |
| `explanation` | String | Explanation text | Optional |
| `topic` | String | Topic tag for analytics | Optional |

### 5.1.4 API Payload Dictionary

#### A. Register Request
| Key | Type | Description |
|---|---|---|
| `name` | String | User full name |
| `email` | String | User email |
| `password` | String | Plain password (encrypted server-side) |

#### B. Login Request
| Key | Type | Description |
|---|---|---|
| `email` | String | Registered email |
| `password` | String | User password |

#### C. AI Quiz Generate Request (multipart)
| Key | Type | Description |
|---|---|---|
| `text` | String | Optional pasted content |
| `file` | File (PDF/Text) | Optional uploaded study file |

#### D. AI Quiz Summary Request
| Key | Type | Description |
|---|---|---|
| `questions` | Array | Generated AI questions |
| `userAnswers` | Array<Integer/Null> | User selected answers |

---

## 5.2 Class Diagram

The class diagram represents static design relationships between major backend model and service classes.

### 5.2.1 Major Classes in the System

1. **User**
   - Attributes: `id`, `name`, `email`, `password`, `createdAt`, `updatedAt`
   - Responsibility: Stores user profile and credentials

2. **QuizAttempt**
   - Attributes: `id`, `userId`, `quizType`, `correct`, `total`, `percentage`, `createdAt`, `questions`
   - Responsibility: Stores each quiz attempt with summary and detailed answers

3. **QuestionAttempt**
   - Attributes: `question`, `options`, `correctAnswer`, `userAnswer`, `explanation`, `topic`
   - Responsibility: Stores per-question attempt details

4. **ApiController**
   - Methods: `register()`, `login()`, `getQuiz()`, `generateAiQuiz()`, `aiQuizSummary()`, `saveQuizAttempt()`, `getQuizHistory()`
   - Responsibility: Exposes all REST endpoints and orchestrates operations

5. **GeminiService**
   - Methods: `extractTextFromFile()`, `generateQuiz()`, `generateSummary()`
   - Responsibility: Handles AI prompt creation, Gemini API communication, and parsing responses

6. **JwtService**
   - Methods: `generateToken()`, `validateToken()`, `getUserIdFromToken()`
   - Responsibility: JWT token generation and validation utility

7. **Repositories**
   - `UserRepository`
   - `QuizAttemptRepository`
   - Responsibility: Data access abstraction for MongoDB operations

### 5.2.2 Relationship Summary

- One **User** can have many **QuizAttempt** records (`1..*`).
- One **QuizAttempt** contains many **QuestionAttempt** entries (`1..*`, embedded).
- **ApiController** depends on repositories and services.
- **GeminiService** provides AI methods used by **ApiController**.
- **JwtService** supports authentication token logic.

### 5.2.3 Class Diagram (To Insert)

Draw UML class diagram with:
- Model classes: `User`, `QuizAttempt`, `QuestionAttempt`
- Service classes: `GeminiService`, `JwtService`
- Controller class: `ApiController`
- Repository interfaces: `UserRepository`, `QuizAttemptRepository`
- Associations and dependencies as listed above

---

## 5.3 Data Flow Diagram (DFD)

The DFD explains how data moves between users, processes, external services, and data stores in the system.

### 5.3.1 DFD Level 0 (Context Diagram)

External entities and data flow:

- **User -> System**: registration data, login credentials, quiz inputs, answers
- **System -> User**: quiz questions, scores, feedback, history
- **System -> Gemini API**: AI prompts
- **Gemini API -> System**: generated questions and summaries
- **System <-> MongoDB**: user and attempt storage/retrieval

### 5.3.2 DFD Level 1 (Major Processes)

Main processes:

1. **Process 1.0: User Management**
   - Input: registration/login data
   - Output: account creation status, auth token
   - Data Store: `users`

2. **Process 2.0: Predefined Quiz Handling**
   - Input: quiz start request, answer selections
   - Output: score/result
   - Data Store: `quiz_attempts` (on save)

3. **Process 3.0: AI Quiz Generation**
   - Input: text/file study content
   - Output: AI-generated MCQ set
   - External: Gemini API

4. **Process 4.0: AI Summary and Recommendation**
   - Input: questions + user answers
   - Output: topic strengths, summary, recommendations
   - External: Gemini API

5. **Process 5.0: History and Analytics**
   - Input: user ID/session context
   - Output: attempt list, averages, progress view
   - Data Store: `quiz_attempts`

### 5.3.3 DFD Level 2 (Recommended Deep Dive)

For report depth, add Level 2 for Process 3.0 (AI Quiz Generation):
- Validate input presence
- Extract file text (if file provided)
- Merge with text input
- Build structured prompt
- Call Gemini API
- Parse JSON response
- Return normalized question list

### 5.3.4 DFD Diagrams (To Insert)

Insert:
- DFD Level 0 (Context)
- DFD Level 1 (Core process decomposition)
- Optional DFD Level 2 for AI generation flow

---

## 5.4 Extended E-R Diagram

The Extended Entity-Relationship (E-ER) diagram models entities, attributes, and cardinalities in the persistence layer, while also showing embedded structures used by document databases.

### 5.4.1 Entities

1. **User**
2. **QuizAttempt**
3. **QuestionAttempt** (embedded sub-entity/document component)

### 5.4.2 Key Attributes

#### User
- `id` (PK)
- `name`
- `email` (Unique)
- `password`
- `createdAt`
- `updatedAt`

#### QuizAttempt
- `id` (PK)
- `userId` (FK reference to User)
- `quizType`
- `correct`
- `total`
- `percentage`
- `createdAt`
- `questions[]`

#### QuestionAttempt (Embedded)
- `question`
- `options[]`
- `correctAnswer`
- `userAnswer`
- `explanation`
- `topic`

### 5.4.3 Cardinality

- **User (1) -> (M) QuizAttempt**
- **QuizAttempt (1) -> (M) QuestionAttempt (embedded list)**

### 5.4.4 E-ER Diagram (To Insert)

Draw E-ER with:
- Primary/foreign keys
- One-to-many relationship from `User` to `QuizAttempt`
- Embedded one-to-many structure for `QuestionAttempt` inside `QuizAttempt`
- Attribute lists for each entity

---

## Chapter Summary

This chapter presented the design-level blueprint of the AI-Powered Quiz Application. It documented the data dictionary, identified core classes and relationships, explained data movement through DFD levels, and modeled persistence through an extended ER view. Together, these design artifacts provide a clear foundation for implementation, testing, and future enhancement of the system.

