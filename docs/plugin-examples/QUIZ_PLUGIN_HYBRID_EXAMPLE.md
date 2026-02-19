# Quiz Plugin - Hybrid-Ansatz Beispiel

## Übersicht

Dieses Dokument zeigt eine vollständige Implementierung eines Quiz-Plugins mit dem Hybrid-Ansatz:
- **GraphQL (Opencast):** Event-Metadaten, User-Info
- **Convex:** Quiz-Definitionen, Submissions, Real-time Results

## Projekt-Struktur

```
quiz-plugin/
├── src/
│   ├── index.ts                    # Plugin Entry
│   ├── convex/
│   │   ├── client.ts              # Convex Client Setup
│   │   └── _generated/            # Auto-generated (Convex)
│   ├── views/
│   │   └── QuizView.tsx           # Main Component
│   └── components/
│       ├── QuizForm.tsx
│       └── QuizResults.tsx
├── convex/
│   ├── schema.ts                   # Database Schema
│   ├── quiz.ts                    # Quiz Functions
│   └── auth.ts                    # Authentication
├── package.json
└── README.md
```

## Schritt 1: Convex Setup

### 1.1 Installation

```bash
cd plugins/quiz-plugin
pnpm add convex
npx convex dev
```

### 1.2 Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Quiz Definitions (created by instructors)
  quizDefinitions: defineTable({
    eventId: v.string(),           // Opencast Event ID
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      type: v.union(
        v.literal("multiple_choice"),
        v.literal("single_choice"),
        v.literal("text")
      ),
      options: v.optional(v.array(v.string())),
      correctAnswer: v.optional(v.any()),
      points: v.number(),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),         // Opencast User ID
  })
    .index("by_event", ["eventId"])
    .index("by_creator", ["createdBy"]),
    
  // Quiz Submissions (from students)
  quizSubmissions: defineTable({
    eventId: v.string(),
    quizId: v.id("quizDefinitions"),
    userId: v.string(),             // Opencast User ID
    answers: v.array(v.object({
      questionId: v.string(),
      answer: v.any(),
      isCorrect: v.optional(v.boolean()),
    })),
    score: v.number(),
    maxScore: v.number(),
    submittedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_quiz", ["quizId"]),
});
```

### 1.3 Convex Functions

```typescript
// convex/quiz.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get quiz for an event
export const getQuiz = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db
      .query("quizDefinitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!quiz) return null;
    
    // Don't expose correct answers to students
    return {
      id: quiz._id,
      eventId: quiz.eventId,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        // correctAnswer is hidden
      })),
      isActive: quiz.isActive,
    };
  },
});

// Submit quiz
export const submitQuiz = mutation({
  args: {
    eventId: v.string(),
    userId: v.string(),
    answers: v.array(v.object({
      questionId: v.string(),
      answer: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    // Get quiz definition
    const quiz = await ctx.db
      .query("quizDefinitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!quiz) {
      throw new Error("Quiz not found or inactive");
    }
    
    // Check if user already submitted
    const existing = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      throw new Error("Quiz already submitted");
    }
    
    // Calculate score
    let score = 0;
    let maxScore = 0;
    const gradedAnswers = args.answers.map(answer => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false };
      
      maxScore += question.points;
      const isCorrect = checkAnswer(question, answer.answer);
      if (isCorrect) {
        score += question.points;
      }
      
      return { ...answer, isCorrect };
    });
    
    // Save submission
    const submissionId = await ctx.db.insert("quizSubmissions", {
      eventId: args.eventId,
      quizId: quiz._id,
      userId: args.userId,
      answers: gradedAnswers,
      score,
      maxScore,
      submittedAt: Date.now(),
    });
    
    return {
      submissionId,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
    };
  },
});

// Get user's submission
export const getMySubmission = query({
  args: { eventId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", args.userId)
      )
      .first();
  },
});

// Get results (for instructors)
export const getResults = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        participationRate: 0,
        submissions: [],
      };
    }
    
    const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
    const totalMaxScore = submissions[0]?.maxScore || 1;
    
    return {
      totalSubmissions: submissions.length,
      averageScore: Math.round((totalScore / submissions.length / totalMaxScore) * 100),
      participationRate: 0, // Would need total enrolled users from Opencast
      submissions: submissions.map(s => ({
        userId: s.userId,
        score: s.score,
        maxScore: s.maxScore,
        percentage: Math.round((s.score / s.maxScore) * 100),
        submittedAt: s.submittedAt,
      })),
    };
  },
});

// Helper function
function checkAnswer(question: any, answer: any): boolean {
  if (question.type === "multiple_choice" || question.type === "single_choice") {
    return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
  }
  // For text answers, could do fuzzy matching
  return answer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
}
```

## Schritt 2: Frontend Plugin

### 2.1 Convex Client Setup

```typescript
// src/convex/client.ts
import { ConvexReactClient } from "convex/react";

// Get Convex URL from environment or config
const getConvexUrl = () => {
  // Option 1: Environment variable
  if (import.meta.env.VITE_CONVEX_URL) {
    return import.meta.env.VITE_CONVEX_URL;
  }
  
  // Option 2: Fetch from backend config
  // This would be done in a setup function
  return "https://your-deployment.convex.cloud";
};

export const convexClient = new ConvexReactClient(getConvexUrl());
```

### 2.2 Plugin Entry Point

```typescript
// src/index.ts
import { createPlugin } from "@workspace/plugin-system";
import { ConvexProvider } from "convex/react";
import { convexClient } from "./convex/client";
import { QuizView } from "./views/QuizView";

const quizPlugin = createPlugin({
  namespace: "quiz",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    // Register app
    manager.registerObject("apps:definitions", "quiz-app", {
      id: "quiz-app",
      name: "Quiz",
      routePath: "/quiz/:eventId",
      component: () => (
        <ConvexProvider client={convexClient}>
          <QuizView />
        </ConvexProvider>
      ),
    });

    // Register sidebar navigation
    manager.registerObject("sidebar:nav-items", "quiz-nav", {
      title: "Quiz",
      path: "/quiz",
      icon: "HelpCircle",
      order: 150,
    });
  },

  activate() {},
  deactivate() {},
});

export default quizPlugin;
```

### 2.3 Main Quiz View

```typescript
// src/views/QuizView.tsx
import { useParams } from "@workspace/router";
import { useGetEventByIdQuery, useGetCurrentUser } from "@workspace/query";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { QuizForm } from "../components/QuizForm";
import { QuizResults } from "../components/QuizResults";
import { Card, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components";

export const QuizView = () => {
  const { eventId } = useParams("/quiz/:eventId");
  const { data: currentUser } = useGetCurrentUser();
  
  // Get Event data from Opencast GraphQL
  const { data: eventData, isLoading: eventLoading } = useGetEventByIdQuery(
    { eventId },
    { enabled: !!eventId }
  );
  
  // Get Quiz data from Convex (Real-time!)
  const quiz = useQuery(api.quiz.getQuiz, { eventId });
  const mySubmission = useQuery(
    api.quiz.getMySubmission,
    { 
      eventId, 
      userId: currentUser?.username || "" 
    },
    { enabled: !!currentUser?.username }
  );
  const results = useQuery(api.quiz.getResults, { eventId });
  
  const submitQuiz = useMutation(api.quiz.submitQuiz);
  
  if (eventLoading || !eventData?.eventById) {
    return <div>Loading event...</div>;
  }
  
  const event = eventData.eventById;
  const hasCompleted = !!mySubmission;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Event Info from GraphQL */}
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            Event ID: {event.id} | Creator: {event.creator}
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Quiz from Convex */}
      {!quiz ? (
        <Card>
          <CardHeader>
            <CardTitle>No Quiz Available</CardTitle>
            <CardDescription>
              There is no active quiz for this event.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : hasCompleted ? (
        <QuizResults 
          submission={mySubmission}
          results={results}
          quiz={quiz}
        />
      ) : (
        <QuizForm 
          quiz={quiz}
          onSubmit={async (answers) => {
            if (!currentUser?.username) {
              throw new Error("User not authenticated");
            }
            
            await submitQuiz({
              eventId,
              userId: currentUser.username,
              answers,
            });
          }}
        />
      )}
    </div>
  );
};
```

### 2.4 Quiz Form Component

```typescript
// src/components/QuizForm.tsx
import { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components";
import { Send } from "lucide-react";

interface QuizFormProps {
  quiz: {
    id: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      type: "multiple_choice" | "single_choice" | "text";
      options?: string[];
      points: number;
    }>;
  };
  onSubmit: (answers: Array<{ questionId: string; answer: any }>) => Promise<void>;
}

export const QuizForm = ({ quiz, onSubmit }: QuizFormProps) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      
      await onSubmit(answerArray);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <label className="text-lg font-semibold">
                {index + 1}. {question.question} ({question.points} points)
              </label>
              
              {question.type === "single_choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => 
                          setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))
                        }
                        required
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === "multiple_choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(answers[question.id] as string[] || []).includes(option)}
                        onChange={(e) => {
                          const current = (answers[question.id] as string[] || []);
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter(o => o !== option);
                          setAnswers(prev => ({ ...prev, [question.id]: updated }));
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === "text" && (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => 
                    setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))
                  }
                  required
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              )}
            </div>
          ))}
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};
```

### 2.5 Quiz Results Component

```typescript
// src/components/QuizResults.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";

interface QuizResultsProps {
  submission: {
    score: number;
    maxScore: number;
    answers: Array<{
      questionId: string;
      answer: any;
      isCorrect?: boolean;
    }>;
    submittedAt: number;
  };
  results?: {
    totalSubmissions: number;
    averageScore: number;
    submissions: Array<{
      userId: string;
      score: number;
      percentage: number;
    }>;
  };
  quiz: {
    questions: Array<{
      id: string;
      question: string;
      points: number;
    }>;
  };
}

export const QuizResults = ({ submission, results, quiz }: QuizResultsProps) => {
  const percentage = Math.round((submission.score / submission.maxScore) * 100);
  
  return (
    <div className="space-y-6">
      {/* Personal Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {submission.score} / {submission.maxScore}
            </div>
            <div className="text-2xl text-muted-foreground">
              {percentage}%
            </div>
          </div>
          
          {/* Answer Review */}
          <div className="space-y-4">
            <h3 className="font-semibold">Answer Review</h3>
            {quiz.questions.map((question, index) => {
              const answer = submission.answers.find(a => a.questionId === question.id);
              const isCorrect = answer?.isCorrect ?? false;
              
              return (
                <div 
                  key={question.id} 
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect 
                      ? "border-green-500 bg-green-50 dark:bg-green-950" 
                      : "border-red-500 bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {question.question}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your answer: {JSON.stringify(answer?.answer)}
                      </p>
                      <p className="text-xs mt-1">
                        Points: {isCorrect ? question.points : 0} / {question.points}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Class Statistics (if available) */}
      {results && results.totalSubmissions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{results.totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Submissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{results.averageScore}%</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{percentage}%</div>
                <div className="text-sm text-muted-foreground">Your Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## Schritt 3: Configuration

### 3.1 Environment Variables

```bash
# .env.local (für Development)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3.2 Backend Config (Optional)

Falls Convex-URL aus Backend geholt werden soll:

```java
// Backend: Config Endpoint
@GET
@Path("/config/plugin-keys")
public Response getPluginKeys() {
    Map<String, String> keys = Map.of(
        "convexUrl", System.getenv("CONVEX_URL"),
        // Never expose full keys to frontend!
    );
    return Response.ok(keys).build();
}
```

## Schritt 4: Real-time Features

### 4.1 Live Results Updates

```typescript
// Results update automatically when new submissions arrive!
const results = useQuery(api.quiz.getResults, { eventId });

// No polling needed - Convex handles real-time updates
// When someone submits, all connected clients see the update
```

### 4.2 Live Participation Counter

```typescript
// Real-time submission count
const submissionCount = useQuery(
  api.quiz.getSubmissionCount,
  { eventId }
);

// Updates automatically as people submit
```

## Vorteile dieses Ansatzes

### GraphQL (Opencast)
- ✅ Event-Metadaten (Title, Creator, etc.)
- ✅ User-Authentifizierung
- ✅ Berechtigungen
- ✅ Konsistente Datenquelle

### Convex
- ✅ Real-time Updates (kein Polling nötig!)
- ✅ Schnelle Entwicklung (kein Backend)
- ✅ Flexible Schema-Änderungen
- ✅ Automatische Skalierung
- ✅ Offline-Support (optional)

## Sicherheit

### 1. Convex URL aus Config

```typescript
// ❌ NIEMALS hardcoden
const CONVEX_URL = "https://...";

// ✅ Aus Environment oder Backend
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
```

### 2. User Validation

```typescript
// convex/auth.ts
export const validateOpencastUser = async (
  ctx: QueryCtx,
  userId: string
): Promise<boolean> => {
  // Validate with Opencast backend
  const token = ctx.auth.getToken();
  // Verify token with Opencast...
  return true;
};
```

### 3. Row-Level Security

```typescript
// Users can only see their own submissions
export const getMySubmission = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx); // From Opencast session
    if (!userId) throw new Error("Unauthorized");
    
    return await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .first();
  },
});
```

## Deployment

### 1. Convex Deployment

```bash
npx convex deploy
```

### 2. Environment Variables

Setze `VITE_CONVEX_URL` in Production-Config.

### 3. Plugin Build

```bash
pnpm build
```

## Zusammenfassung

**Hybrid-Ansatz (GraphQL + Convex):**
- ✅ Event-Daten aus Opencast GraphQL
- ✅ Quiz-Daten in Convex (Real-time!)
- ✅ Keine Backend-Änderungen für Plugin-Daten
- ✅ Schnelle Entwicklung
- ✅ Beste Lösung für Community-Plugins

**Nächste Schritte:**
1. Convex Setup (`npx convex dev`)
2. Schema definieren
3. Functions implementieren
4. Frontend Plugin erstellen
5. GraphQL für Event-Daten nutzen
6. Convex für Quiz-Daten nutzen

Dieser Ansatz gibt dir die Vorteile beider Welten! 🚀
