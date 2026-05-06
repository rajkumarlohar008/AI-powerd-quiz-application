# Chapter 7: Implementation and Testing

## 7.1 Testing Strategy Adopted

Testing is a critical activity to ensure that the developed system is functionally correct, stable, and ready for real use. For the **AI-Powered Quiz Application**, a practical testing strategy was adopted combining manual functional testing with API-level verification.

The strategy focused on validating each module independently and then verifying complete end-to-end user flows.

### 7.1.1 Testing Objectives

The main objectives of testing were:

1. Verify that each functional requirement is correctly implemented.
2. Ensure integration between frontend, backend, database, and AI service.
3. Detect and fix runtime issues such as invalid input handling and API errors.
4. Validate score calculation, summary generation, and history persistence.
5. Check user interface behavior and navigation under normal usage conditions.

### 7.1.2 Testing Levels Used

#### A. Unit-Level Validation (Developer Side)
- Validation of key logic blocks such as score computation and response parsing.
- Verification of backend service methods for expected output structure.

#### B. Integration Testing
- Frontend-to-backend API connectivity verification.
- Backend-to-database persistence checks.
- Backend-to-Gemini API request/response validation.

#### C. System Testing
- Complete workflow testing from user registration to history tracking.
- Validation of real user scenarios across all major features.

#### D. Regression Testing
- Re-testing previously working modules after bug fixes (e.g., API URL/proxy changes).

### 7.1.3 Testing Approach

The project used a **black-box functional testing approach** for user-facing modules:

- Inputs were provided through UI/API calls.
- Outputs were compared with expected behavior.
- Internal implementation details were not the primary focus for acceptance.

For backend API debugging, request/response-level checks were performed using browser network tools and endpoint probing.

### 7.1.4 Test Environment

| Component | Environment Used |
|---|---|
| OS | Windows 10/11 |
| Frontend Runtime | Node.js + React development server |
| Backend Runtime | Java 17 + Spring Boot |
| Database | MongoDB local/connected instance |
| Browser | Chrome/Edge |
| API Verification | Browser DevTools + endpoint checks |
| AI Service | Gemini API key-based access |

### 7.1.5 Entry and Exit Criteria

**Entry Criteria**
- All primary modules implemented.
- Backend server and database connection operational.
- AI key configured and reachable.

**Exit Criteria**
- All major test cases pass.
- Critical bugs resolved.
- End-to-end flows verified (register -> login -> quiz -> result -> history).

---

## 7.2 System Testing

System testing validates the complete integrated application as a whole. In this project, system testing was performed using realistic user actions across the UI and backend APIs.

### 7.2.1 Module-Wise Implementation Verification

#### 1. Authentication Module
- Registration accepts valid user details and rejects duplicate email.
- Login verifies credentials and creates authenticated client session.

#### 2. Predefined Quiz Module
- Questions are fetched from backend API.
- User can select options, navigate questions, and submit quiz.
- Result screen displays score and answer analysis.

#### 3. AI Quiz Generation Module
- User can submit pasted text and/or upload supported file types.
- Backend extracts content and generates AI quiz questions.
- Quiz is rendered dynamically and supports full attempt flow.

#### 4. AI Summary Module
- User answers are submitted for summary generation.
- System returns overall feedback, topic-wise strength, and recommendations.

#### 5. Quiz History Module
- Completed attempts are stored successfully.
- User-specific history list and average score are displayed correctly.

### 7.2.2 Error and Exception Handling Tested

- Empty input during AI quiz generation.
- Unsupported file type handling.
- Invalid login credentials.
- Missing required fields in registration.
- Backend unavailability/network errors.
- API response validation when external AI service fails.

### 7.2.3 Performance Observations

- UI interactions remained responsive under normal academic usage.
- API responses for non-AI operations were fast.
- AI-dependent operations took longer (expected due to external model call).
- Database write/read for attempts performed within acceptable latency.

### 7.2.4 Security-Oriented Checks (Basic)

- Password storage verified as encrypted hash (not plain text).
- Session token generated at login and stored on client.
- Basic route access control on frontend via token presence checks.

> Note: Advanced penetration/security testing is outside the current minor-project scope, but identified as future enhancement.

### 7.2.5 Testing Outcome Summary

| Testing Area | Status | Remark |
|---|---|---|
| User registration/login | Pass | Works as expected |
| Predefined quiz flow | Pass | Stable |
| AI quiz generation | Pass | Depends on API/network availability |
| AI summary generation | Pass | Output quality depends on prompt/model |
| Attempt persistence | Pass | Stored in MongoDB |
| History retrieval | Pass | User-wise data displayed |
| Error handling | Pass (basic) | Clear messages for common failures |

---

## 7.3 Test Cases

This section presents representative test cases used to validate core functionalities.

### 7.3.1 Authentication Test Cases

| Test Case ID | Scenario | Test Input | Expected Output | Result |
|---|---|---|---|---|
| TC-AUTH-01 | Register with valid data | Name, unique email, password | User created successfully | Pass |
| TC-AUTH-02 | Register with existing email | Duplicate email | Error: user already exists | Pass |
| TC-AUTH-03 | Login with valid credentials | Registered email/password | Login success + token | Pass |
| TC-AUTH-04 | Login with invalid password | Valid email + wrong password | Invalid credentials message | Pass |

### 7.3.2 Predefined Quiz Test Cases

| Test Case ID | Scenario | Test Input | Expected Output | Result |
|---|---|---|---|---|
| TC-QUIZ-01 | Load predefined quiz | Start quiz action | Questions fetched and shown | Pass |
| TC-QUIZ-02 | Submit quiz with selected answers | Answer all questions | Score and detailed result shown | Pass |
| TC-QUIZ-03 | Save attempt record | Complete quiz | Attempt stored in database | Pass |

### 7.3.3 AI Quiz Test Cases

| Test Case ID | Scenario | Test Input | Expected Output | Result |
|---|---|---|---|---|
| TC-AI-01 | Generate AI quiz from text | Valid study text | AI-generated questions displayed | Pass |
| TC-AI-02 | Generate AI quiz from PDF | Valid PDF file | Text extracted and quiz generated | Pass |
| TC-AI-03 | Submit empty AI input | No text/file | Validation error message | Pass |
| TC-AI-04 | Unsupported file type | Non-PDF/non-text file | Unsupported file error | Pass |

### 7.3.4 AI Summary and History Test Cases

| Test Case ID | Scenario | Test Input | Expected Output | Result |
|---|---|---|---|---|
| TC-SUM-01 | Generate AI summary | Completed AI quiz answers | Overall + topic summary shown | Pass |
| TC-SUM-02 | Save AI attempt | Completed AI quiz | AI attempt persisted | Pass |
| TC-HIS-01 | View history with attempts | Valid user session | Attempt list and stats displayed | Pass |
| TC-HIS-02 | View history with no attempts | New user | Empty-state message/list | Pass |

### 7.3.5 Negative/Failure Case Coverage

| Test Case ID | Scenario | Expected Behavior | Result |
|---|---|---|---|
| TC-NEG-01 | Backend server down | Network/API error shown in UI | Pass |
| TC-NEG-02 | Invalid API endpoint config | Request fails with actionable error | Pass |
| TC-NEG-03 | AI service unavailable | Graceful failure message returned | Pass |

### 7.3.6 Test Case Execution Summary

- Total test cases executed: **18**  
- Passed: **18**  
- Failed: **0**  
- Major blockers: **None** after integration fixes

---

## Chapter Summary

This chapter detailed the testing strategy and implementation validation of the AI-Powered Quiz Application. Multiple testing levels were applied, including integration and full system testing. Core modules such as authentication, predefined quiz, AI quiz generation, summary creation, and history tracking were validated using structured test cases. The test outcomes confirmed that the system meets its functional objectives and is suitable for academic deployment and demonstration.

