# MongoDB Schema Design - Edu_App

## Design Principles

### MongoDB Best Practices
1. **Embed data** that changes infrequently and is frequently queried together
2. **Reference data** that changes frequently or is shared across multiple documents
3. **Denormalize** to improve read performance
4. **Index** only fields that are actually queried

### Design Decisions
- ✅ **DO NOT create TeacherProfile collection** - Embed teacher information into User document
- ✅ **DO NOT create separate Subject/Grade collections** - Use enums/strings instead
- ✅ **Denormalize** subject names and grade names to reduce populate operations
- ✅ **Add Rubrics model** (currently missing)

---

## 📊 Collections

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String (required),
  phone: String (unique, required),
  role: String (enum: ['admin', 'teacher'], default: 'teacher'),
  avatar: String,
  
  // Embedded teacher info (instead of separate TeacherProfile)
  teacherInfo: {
    schoolName: String,
    expertise: [String],          // ['Mathematics', 'Physics']
    yearsOfExperience: Number,
    bio: String
  },
  
  // Security
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  emailVerifiedAt: Date,
  lastLogin: Date,
  
  // Refresh tokens
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: Date
  }],
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ email: 1 } // unique
{ phone: 1 } // unique
{ role: 1, isActive: 1 }
{ 'refreshTokens.token': 1 }
```

---

### 2. LessonPlans Collection

```javascript
{
  _id: ObjectId,
  
  // Owner (denormalized for easier querying)
  teacher: {
    id: ObjectId (ref: 'User'),
    name: String,              // Cached from User.fullName
    email: String              // Cached from User.email
  },
  
  // Subject & Grade (denormalized - NO reference)
  subject: {
    name: String,              // 'Mathematics', 'Literature'
    code: String               // 'MATH', 'LITERATURE' (optional)
  },
  grade: {
    level: Number,             // 6, 7, 8...
    name: String               // 'Grade 6', 'Grade 7'
  },
  
  // Basic info
  title: String (required),
  lessonNumber: Number,
  chapter: String,
  numPeriods: Number (default: 1),
  
  // Objectives (embedded)
  objectives: {
    knowledge: [String],
    skills: [String],
    attitude: [String],
    competence: [String]
  },
  
  learningOutcomes: {
    general: [String],
    specific: [String]
  },
  
  // Teaching details
  materials: [String],
  teachingMethods: [String],
  
  activities: [{
    name: String,
    goal: String,
    steps: {
      assign: String,
      perform: String,
      report: String,
      conclude: String
    }
  }],
  
  assessmentCriteria: [{
    criterion: String,
    method: String,
    level: String,
    notes: String
  }],
  
  // Attachments
  notes: String,
  attachments: [{
    filename: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  
  // AI metadata
  isAIGenerated: Boolean (default: false),
  aiPrompt: String,
  aiModel: String,
  generationTime: Date,
  
  // Status & versioning
  status: String (enum: ['draft', 'completed', 'approved', 'archived'], default: 'draft'),
  version: Number (default: 1),
  isPublic: Boolean (default: false),
  isTemplate: Boolean (default: false),
  
  // Engagement metrics
  viewCount: Number (default: 0),
  likeCount: Number (default: 0),
  downloadCount: Number (default: 0),
  
  // Approval
  approvedBy: ObjectId (ref: 'User'),
  approvedAt: Date,
  
  // Tags
  tags: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ 'teacher.id': 1, status: 1 }
{ 'subject.name': 1, 'grade.level': 1 }
{ status: 1, isPublic: 1 }
{ tags: 1 }
{ createdAt: -1 }
```

---

### 3. Quizzes Collection

```javascript
{
  _id: ObjectId,
  
  // Owner (denormalized)
  teacher: {
    id: ObjectId (ref: 'User'),
    name: String,
    email: String
  },
  
  // Subject & Grade (denormalized)
  subject: {
    name: String,
    code: String
  },
  grade: {
    level: Number,
    name: String
  },
  
  // Basic info
  title: String (required),
  description: String,
  quizType: String (enum: ['practice', 'test', 'exam', 'homework'], default: 'practice'),
  
  // Questions (embedded array)
  questions: [{
    questionNumber: Number,
    questionType: String (enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'], default: 'multiple-choice'),
    questionText: String,
    questionImage: String,
    options: [{
      optionKey: String,
      optionText: String,
      optionImage: String
    }],
    correctAnswer: Mixed,
    explanation: String,
    difficulty: String (enum: ['easy', 'medium', 'hard'], default: 'medium'),
    tags: [String],
    topic: String
  }],
  
  // Settings (embedded)
  settings: {
    timeLimit: Number,
    passingScore: Number (default: 70),
    shuffleQuestions: Boolean (default: false),
    shuffleOptions: Boolean (default: true),
    showResults: Boolean (default: true),
    showCorrectAnswers: Boolean (default: false),
    allowRetake: Boolean (default: false),
    maxAttempts: Number (default: 1)
  },
  
  // AI metadata
  isAIGenerated: Boolean (default: false),
  aiPrompt: String,
  aiModel: String,
  
  // Statistics
  totalAttempts: Number (default: 0),
  averageScore: Number (default: 0),
  
  // Status
  status: String (enum: ['draft', 'published', 'archived'], default: 'draft'),
  isPublic: Boolean (default: false),
  tags: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ 'teacher.id': 1, status: 1 }
{ 'subject.name': 1, 'grade.level': 1 }
{ status: 1, isPublic: 1 }
{ tags: 1 }
{ createdAt: -1 }
```

---

### 4. Rubrics Collection (NEW - currently missing)

```javascript
{
  _id: ObjectId,
  
  // Owner (denormalized)
  teacher: {
    id: ObjectId (ref: 'User'),
    name: String,
    email: String
  },
  
  // Subject & Grade (denormalized)
  subject: {
    name: String,
    code: String
  },
  grade: {
    level: Number,
    name: String
  },
  
  // Basic info
  title: String (required),
  description: String,
  assessmentType: String (enum: ['presentation', 'report', 'project', 'test', 'essay']),
  
  // Criteria (embedded array)
  criteria: [{
    name: String,
    description: String,
    weightPercent: Number,
    levels: [{
      label: String,              // 'Excellent', 'Good', 'Satisfactory', 'Unsatisfactory'
      scoreRange: String,          // '9-10', '7-8', '5-6', '0-4'
      description: String
    }]
  }],
  
  // AI metadata
  isAIGenerated: Boolean (default: false),
  aiPrompt: String,
  aiModel: String,
  
  // Status
  status: String (enum: ['draft', 'published', 'archived'], default: 'draft'),
  isPublic: Boolean (default: false),
  tags: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ 'teacher.id': 1, status: 1 }
{ 'subject.name': 1, 'grade.level': 1 }
{ status: 1, isPublic: 1 }
{ createdAt: -1 }
```

---

### 5. AIUsage Collection

```javascript
{
  _id: ObjectId,
  
  user: {
    id: ObjectId (ref: 'User'),
    email: String                // Cached
  },
  
  feature: String (enum: ['lessonPlan', 'quiz', 'rubric'], required),
  
  // AI provider info
  aiProvider: String,             // 'gemini', 'openai'
  model: String,                  // 'gemini-2.5-flash'
  
  // Usage metrics
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  processingTime: Number,         // milliseconds
  
  // Request/Response (optional, for debugging)
  prompt: String,
  response: String,
  
  // Status
  success: Boolean (default: true),
  errorMessage: String,
  
  createdAt: Date
}
```

**Indexes:**
```javascript
{ 'user.id': 1, feature: 1 }
{ feature: 1, success: 1 }
{ createdAt: -1 }
```

---

## 🗑️ Collections NOT NEEDED

### ❌ TeacherProfile
**Reason:** Teacher information is embedded into User document as `teacherInfo` field

### ❌ Subjects
**Reason:** 
- Rarely changes, can be hardcoded or use enums
- Denormalized into LessonPlans/Quizzes/Rubrics documents

### ❌ Grades
**Reason:**
- Fixed data (Grades 1-12)
- Denormalized into documents

### ❌ Classes
**Reason:** Not currently used in existing controllers

---

## 📋 Reference Data (Constants)

Instead of separate collections, use constants:

```javascript
// constants/subjects.js
const SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', level: 'THCS' },
  { code: 'LITERATURE', name: 'Literature', level: 'THCS' },
  { code: 'ENGLISH', name: 'English', level: 'THCS' },
  { code: 'PHYSICS', name: 'Physics', level: 'THPT' },
  { code: 'CHEMISTRY', name: 'Chemistry', level: 'THPT' },
  { code: 'BIOLOGY', name: 'Biology', level: 'THPT' },
  { code: 'HISTORY', name: 'History', level: 'THCS' },
  { code: 'GEOGRAPHY', name: 'Geography', level: 'THCS' },
  { code: 'CIVIC', name: 'Civic Education', level: 'THCS' },
  { code: 'IT', name: 'Information Technology', level: 'THCS' }
];

// constants/grades.js
const GRADES = [
  { level: 1, name: 'Grade 1' },
  { level: 2, name: 'Grade 2' },
  // ... 
  { level: 12, name: 'Grade 12' }
];
```

---

## 🔄 Migration Strategy

### Step 1: Update Models
1. ✅ Keep User model as-is (already good)
2. 🔧 Fix LessonPlan: Remove TeacherProfile reference
3. 🔧 Fix Quiz: Remove TeacherProfile reference  
4. ➕ Add Rubrics model
5. ✅ Keep AIUsage model (simple)

### Step 2: Update Controllers
- Replace `TeacherProfile` queries → directly use `User`
- Denormalize subject/grade when creating/updating documents

### Step 3: Seed Data (Optional)
- If needed, create script to seed subjects/grades into constants

---

## ✅ Advantages of This Design

1. **Simplicity:** 5 collections instead of 8+
2. **Performance:** Fewer populate operations, fewer joins
3. **Flexibility:** Easy to add new fields
4. **Maintainability:** Reduced dependencies between collections
5. **Scalability:** Denormalization works well for read-heavy workloads

## ⚠️ Trade-offs

1. **Data duplication:** Subject/Grade names are stored in multiple places
   - ✅ Acceptable because they rarely change
2. **Update complexity:** If a teacher renames, multiple documents need to be updated
   - ✅ Acceptable because this rarely happens
