# Chapter 6: Work Plan and System Database Structure

## 6.1 Time Frame Work

A proper work plan is essential for completing a software project within academic deadlines while maintaining quality. The development of the **AI-Powered Quiz Application** was organized into structured phases, where each phase focused on specific deliverables such as requirements, implementation, integration, testing, and documentation.

The project followed an iterative approach, so some activities (like debugging and refinement) overlapped across phases.

### 6.1.1 Project Timeline Overview

| Phase | Activity | Duration | Output |
|---|---|---|---|
| Phase 1 | Problem identification and requirement gathering | Week 1-2 | Problem statement, requirement list |
| Phase 2 | Literature review and technology selection | Week 3-4 | Review report, finalized tech stack |
| Phase 3 | System design (architecture, DFD, ER, class design) | Week 5-6 | Design artifacts and module plan |
| Phase 4 | Frontend implementation | Week 7-8 | UI modules: auth, dashboard, quiz screens |
| Phase 5 | Backend API and database implementation | Week 9-10 | REST APIs and MongoDB integration |
| Phase 6 | AI integration (quiz + summary generation) | Week 11-12 | Gemini-powered AI quiz modules |
| Phase 7 | Testing, bug fixing, optimization | Week 13-14 | Stable build with validated workflows |
| Phase 8 | Documentation, screenshots, final report | Week 15-16 | Final project report and presentation |

### 6.1.2 Milestone-Based Work Plan

#### Milestone 1: Requirement Freeze
- Finalized scope (predefined quiz + AI quiz + history)
- Confirmed user-centric workflow
- Identified functional and non-functional requirements

#### Milestone 2: Design Completion
- Finalized architecture of React + Spring Boot + MongoDB
- Prepared DFD, class diagram, and ER model
- Created API endpoint plan

#### Milestone 3: Core Feature Development
- Implemented user registration and login
- Implemented predefined quiz and result logic
- Added quiz attempt save and history retrieval

#### Milestone 4: AI Feature Integration
- Added text/file input for AI quiz generation
- Integrated Gemini API for MCQ generation
- Added AI summary, topic insights, and recommendations

#### Milestone 5: Validation and Documentation
- Completed end-to-end flow testing
- Fixed API/proxy/network issues
- Prepared report chapters and appendix screenshots

### 6.1.3 Weekly Effort Distribution (Suggested Table for Report)

| Week Range | Primary Focus | Secondary Focus |
|---|---|---|
| 1-2 | Domain analysis | Requirement documentation |
| 3-4 | Literature review | Tools setup |
| 5-6 | System design diagrams | API planning |
| 7-8 | Frontend development | UI refinement |
| 9-10 | Backend + DB coding | Endpoint testing |
| 11-12 | AI integration | Prompt/response handling |
| 13-14 | Testing and fixes | Performance/error handling |
| 15-16 | Report writing | Final demo prep |

### 6.1.4 Gantt Chart (To Insert)

Insert a Gantt chart showing phase-wise activity timelines from Week 1 to Week 16.  
Recommended tasks in chart:
- Requirement Analysis
- Literature Review
- System Design
- Frontend Development
- Backend Development
- AI Integration
- Testing & Debugging
- Documentation

---

## 6.2 Design Database Table

Although MongoDB is a NoSQL database (collection/document based), this section presents database design in structured tabular form for clarity and academic reporting.

### 6.2.1 Database Technology

- **Database Used**: MongoDB
- **Access Layer**: Spring Data MongoDB repositories
- **Design Approach**: Document model with embedded subdocuments for question attempts

### 6.2.2 Collection 1: `users`

**Purpose**: Stores registered user information and authentication credentials.

| Field Name | Type | Key | Null | Description |
|---|---|---|---|---|
| `id` | ObjectId/String | Primary | No | Unique user identifier |
| `name` | String | - | No | Full name of user |
| `email` | String | Unique | No | Login email address |
| `password` | String | - | No | Encrypted password hash |
| `createdAt` | DateTime | - | No | Account creation timestamp |
| `updatedAt` | DateTime | - | No | Last update timestamp |

### 6.2.3 Collection 2: `quiz_attempts`

**Purpose**: Stores quiz attempt metadata and detailed answer records.

| Field Name | Type | Key | Null | Description |
|---|---|---|---|---|
| `id` | ObjectId/String | Primary | No | Unique attempt identifier |
| `userId` | String | Indexed | No | Linked user identifier |
| `quizType` | String | - | No | `PREDEFINED` or `AI` |
| `correct` | Integer | - | No | Number of correct answers |
| `total` | Integer | - | No | Total questions in attempt |
| `percentage` | Double | - | No | Calculated score percentage |
| `createdAt` | DateTime | - | No | Attempt submission time |
| `questions` | Array<Object> | - | Yes | Embedded question-level records |

### 6.2.4 Embedded Structure: `questions[]` in `quiz_attempts`

| Field Name | Type | Null | Description |
|---|---|---|---|
| `question` | String | No | Question text |
| `options` | Array<String> | No | Option list shown to user |
| `correctAnswer` | Integer | No | Correct option index |
| `userAnswer` | Integer | Yes | User-selected option index |
| `explanation` | String | Yes | Explanation for answer |
| `topic` | String | Yes | Topic classification |

### 6.2.5 Key Database Operations

#### Users
- Insert user during registration
- Query by email during login
- Query by ID for attempt ownership validation

#### Quiz Attempts
- Insert attempt after quiz completion
- Query attempts by `userId` sorted by latest date
- Aggregate overall count and average score for history view

### 6.2.6 Normalization and Design Justification

Because MongoDB is document-oriented, strict relational normalization is not mandatory.  
Embedding `questions[]` inside `quiz_attempts` is justified because:

- A complete attempt can be read in a single query
- Question details belong directly to one attempt context
- Read performance for history and result views is improved

At the same time, referencing `userId` maintains separation between user identity data and attempt data.

### 6.2.7 Indexing Strategy

Recommended indexes for performance:

1. Unique index on `users.email`
2. Index on `quiz_attempts.userId`
3. Optional compound index on `quiz_attempts.userId + createdAt` for history sorting

### 6.2.8 Database Design Diagram (To Insert)

Insert a database structure diagram showing:
- `users` collection
- `quiz_attempts` collection
- one-to-many mapping (`users.id` -> `quiz_attempts.userId`)
- embedded `questions[]` block within `quiz_attempts`

---

## Chapter Summary

This chapter presented the practical execution plan and database design of the proposed system. The work plan outlined phase-wise progress from requirement analysis to final documentation. The database section defined the MongoDB collections, key fields, constraints, and indexing strategy required for secure and efficient operation. Together, these elements ensure that project implementation remains organized, trackable, and technically robust.

