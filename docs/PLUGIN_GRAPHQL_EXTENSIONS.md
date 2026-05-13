# Plugin GraphQL Extensions

## Merged fragments (extending Event in core queries)

Plugins can extend the core `Event` type so that **core** queries (e.g. `GetMyEvents`, `EventsFromSeries`, `GetEventById` when using `EventsData`) automatically include plugin-added fields. No custom query in the plugin is required; the core fetcher injects merged plugin fragments at runtime.

**How it works:**

1. **Backend:** Your plugin extends `Event` via a GraphQL type extension (e.g. `quizInfo`, `quiz`).
2. **Plugin frontend:** Export `__injected_fragments__` with a fragment on type `Event`. The fragment-extractor Vite plugin can do this automatically from `.graphql` files in your plugin (see [community-plugin.config.ts](../packages/vite-config/src/community-plugin.config.ts) and `extractFragments: true`).
3. **At load time:** When the plugin is loaded, `loadAndRegister` calls `fragmentRegistry.registerAll(module.__injected_fragments__, pluginId)`.
4. **At request time:** The core query package’s fetcher replaces the stub `PluginEventFields` fragment with `fragmentRegistry.getMergedFragment("Event", "PluginEventFields")` before sending any GraphQL request. So every query that uses the `EventsData` fragment (and thus `...PluginEventFields`) gets your plugin’s fields in the response.

**What you need to do:**

- In your plugin, add a `.graphql` file that defines a fragment on `Event`, e.g.  
  `fragment QuizEventFields on Event { quizInfo { hasQuiz quizId } quiz { id title } }`  
  (or whatever your backend extension exposes).
- Use a Vite config that includes the fragment-extractor (e.g. `createCommunityPluginConfig({ extractFragments: true })`) so the build emits `__injected_fragments__`.
- Use core hooks like `useGetMyEventsQuery` or `useGetEventByIdQuery` (with a query that spreads `EventsData`). The returned `Event` objects will include your plugin’s fields; you may need to cast or extend the type for TypeScript.

**Convention (scales to any type):** Core defines one stub per extensible type: `fragment Plugin<Type>Fields on <Type> { __typename }`. The fetcher replaces *any* such stub with `fragmentRegistry.getMergedFragment(typeName, fragmentName)`. To support a new type, add a stub and spread it in the corresponding core query/fragment; no fetcher changes needed.

**Currently wired:** `Event`, `Series`, `CurrentUser`, `User` (see `queries.graphql`). Plugins register fragments with `targetType: "Event"`, `"Series"`, `"CurrentUser"`, or `"User"` and they are merged into core queries automatically. Use `CurrentUser` for the logged-in user (`User` query), `User` for user list nodes (`SearchUser`).

---

## Übersicht

Das Opencast GraphQL-System unterstützt Type Extensions, die es ermöglichen, bestehende Types (wie `Event`, `Series`, `Mutation`) um neue Felder zu erweitern. Dies ist ideal für Plugins, die zusätzliche Daten zu bestehenden Entities hinzufügen möchten.

## GraphQL Extension Pattern

### Wie es funktioniert

Das Backend nutzt `@GraphQLTypeExtension` Annotationen, um bestehende GraphQL Types zu erweitern:

```java
@GraphQLTypeExtension(GqlEvent.class)
public final class MuiEventExtension {
  private final GqlEvent event;
  
  public MuiEventExtension(GqlEvent event) {
    this.event = event;
  }
  
  @GraphQLField
  public MuiEventInfo muiEventInfo() {
    return new MuiEventInfo(event);
  }
}
```

### Plugin-Erweiterungen

**Ja, Plugins können GraphQL erweitern!** Du musst:

1. **Backend-Modul erstellen** (Java/OSGi Bundle)
2. **GraphQL Extension implementieren**
3. **Als OSGi Component registrieren**

## Beispiel: Quiz Plugin mit GraphQL Extension

### Backend: GraphQL Extension

```java
package org.opencastproject.plugin.quiz;

import org.opencastproject.graphql.event.GqlEvent;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.osgi.service.component.annotations.Component;

@GraphQLTypeExtension(GqlEvent.class)
@Component(service = QuizEventExtension.class)
public final class QuizEventExtension {
  
  private final GqlEvent event;
  private final QuizService quizService;
  
  public QuizEventExtension(GqlEvent event) {
    this.event = event;
    // QuizService wird über OSGi Dependency Injection bereitgestellt
  }
  
  @GraphQLField
  public QuizInfo quizInfo() {
    String eventId = event.getId();
    return quizService.getQuizInfo(eventId);
  }
  
  @GraphQLField
  public QuizResults quizResults() {
    String eventId = event.getId();
    return quizService.getResults(eventId);
  }
}
```

### GraphQL Query im Frontend

```typescript
// .local-plugins/quiz-plugin/src/queries/quiz.graphql
fragment QuizInfo on Event {
  id
  title
  quizInfo {
    hasQuiz
    questionCount
    isCompleted
  }
  quizResults {
    totalSubmissions
    averageScore
    participationRate
  }
}

query GetEventWithQuiz($eventId: String!) {
  eventById(id: $eventId) {
    ...EventsData
    ...QuizInfo
  }
}
```

### Frontend Plugin Usage

```typescript
import { useGetEventWithQuizQuery } from "@oc-mui/query";

const QuizView = ({ eventId }: { eventId: string }) => {
  const { data } = useGetEventWithQuizQuery({ eventId });
  
  const quizInfo = data?.eventById?.quizInfo;
  const results = data?.eventById?.quizResults;
  
  // ...
};
```

## Hybrid-Ansatz: GraphQL + Convex

### Architektur

```
┌─────────────────────────────────────────┐
│  Frontend Plugin                        │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐    │
│  │  GraphQL      │  │  Convex      │    │
│  │  (Opencast)   │  │  (Plugin DB) │    │
│  └──────────────┘  └──────────────┘    │
│         │                 │             │
│         ▼                 ▼             │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Event Data    │  │ Quiz Data    │    │
│  │ (Read-only)   │  │ (Read/Write) │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

**Aufteilung:**
- **GraphQL (Opencast):** Event-Metadaten, User-Info, Read-only Daten
- **Convex:** Plugin-spezifische Daten (Quiz-Submissions, Polls, etc.)

### Vorteile

1. ✅ **Event-Daten aus GraphQL:** Nutzt bestehende Opencast-Daten
2. ✅ **Plugin-Daten in Convex:** Schnelle Entwicklung, Real-time
3. ✅ **Kombination:** Best of both worlds
4. ✅ **Keine Backend-Änderungen:** Für Plugin-Daten

## Implementierung: Quiz Plugin (Hybrid)

### 1. Convex Setup

```bash
cd .local-plugins/quiz-plugin
npm install convex
npx convex dev
```

### 2. Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  quizSubmissions: defineTable({
    eventId: v.string(),        // From Opencast GraphQL
    userId: v.string(),        // From Opencast GraphQL
    answers: v.array(v.any()),
    score: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),
    
  quizDefinitions: defineTable({
    eventId: v.string(),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      type: v.union(v.literal("multiple_choice"), v.literal("text")),
      options: v.optional(v.array(v.string())),
      correctAnswer: v.optional(v.any()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"]),
});
```

### 3. Convex Functions

```typescript
// convex/quiz.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Submit quiz answer
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
    // Get quiz definition from Convex
    const quiz = await ctx.db
      .query("quizDefinitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
    
    if (!quiz) {
      throw new Error("Quiz not found for this event");
    }
    
    // Calculate score
    const score = calculateScore(quiz.questions, args.answers);
    
    // Save submission
    const submissionId = await ctx.db.insert("quizSubmissions", {
      eventId: args.eventId,
      userId: args.userId,
      answers: args.answers,
      score,
      submittedAt: Date.now(),
    });
    
    return { submissionId, score };
  },
});

// Get quiz for event
export const getQuiz = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizDefinitions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
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

// Get aggregated results (for instructors)
export const getResults = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    return {
      totalSubmissions: submissions.length,
      averageScore: submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length,
      submissions: submissions.map(s => ({
        userId: s.userId,
        score: s.score,
        submittedAt: s.submittedAt,
      })),
    };
  },
});
```

### 4. Frontend Plugin: GraphQL + Convex

```typescript
// .local-plugins/quiz-plugin/src/views/QuizView.tsx
import { useGetEventByIdQuery } from "@oc-mui/query";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useGetCurrentUser } from "@oc-mui/query";

export const QuizView = ({ eventId }: { eventId: string }) => {
  // Get Event data from Opencast GraphQL
  const { data: eventData } = useGetEventByIdQuery({ eventId });
  const { data: currentUser } = useGetCurrentUser();
  
  // Get Quiz data from Convex
  const quiz = useQuery(api.quiz.getQuiz, { eventId });
  const mySubmission = useQuery(
    api.quiz.getMySubmission, 
    { eventId, userId: currentUser?.username || "" }
  );
  const results = useQuery(api.quiz.getResults, { eventId });
  
  const submitQuiz = useMutation(api.quiz.submitQuiz);
  
  // Real-time updates from Convex!
  // quiz, mySubmission, results update automatically
  
  if (!eventData?.eventById) {
    return <div>Loading event...</div>;
  }
  
  if (!quiz) {
    return <div>No quiz available for this event</div>;
  }
  
  const event = eventData.eventById;
  const hasCompleted = !!mySubmission;
  
  return (
    <div className="space-y-6">
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
      {hasCompleted ? (
        <QuizResults 
          submission={mySubmission}
          results={results}
        />
      ) : (
        <QuizForm 
          quiz={quiz}
          onSubmit={async (answers) => {
            await submitQuiz({
              eventId,
              userId: currentUser?.username || "",
              answers,
            });
          }}
        />
      )}
    </div>
  );
};
```

### 5. Convex Configuration im Plugin

```typescript
// .local-plugins/quiz-plugin/src/convex/config.ts
// Convex URL aus Environment Variable oder Config
export const CONVEX_URL = 
  import.meta.env.VITE_CONVEX_URL || 
  "https://your-deployment.convex.cloud";

// Oder aus Backend Config holen
export const getConvexConfig = async () => {
  const response = await fetch("/admin-ng/config/plugin-keys");
  const config = await response.json();
  return {
    url: config.convexUrl,
    key: config.convexKey, // Nur für Server Functions
  };
};
```

### 6. Convex Client Setup

```typescript
// .local-plugins/quiz-plugin/src/convex/client.ts
import { ConvexReactClient } from "convex/react";

// Convex URL sollte aus Config kommen
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("VITE_CONVEX_URL environment variable is required");
}

export const convexClient = new ConvexReactClient(CONVEX_URL);

// In Plugin-Provider wrappen
export const QuizProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  );
};
```

## GraphQL Extension für Quiz Info (Optional)

Wenn du Quiz-Metadaten auch über GraphQL verfügbar machen willst:

### Backend Extension

```java
@GraphQLTypeExtension(GqlEvent.class)
@Component(service = QuizEventExtension.class)
public final class QuizEventExtension {
  
  private final GqlEvent event;
  private final ConvexQuizService convexService; // Wrapper für Convex
  
  @GraphQLField
  public QuizMetadata quizMetadata() {
    String eventId = event.getId();
    // Fetch from Convex via HTTP API
    QuizDefinition quiz = convexService.getQuizDefinition(eventId);
    
    if (quiz == null) {
      return null;
    }
    
    return new QuizMetadata(
      quiz.hasQuiz(),
      quiz.questionCount(),
      quiz.isActive()
    );
  }
}
```

### GraphQL Query

```graphql
query GetEventWithQuizMetadata($eventId: String!) {
  eventById(id: $eventId) {
    id
    title
    quizMetadata {
      hasQuiz
      questionCount
      isActive
    }
  }
}
```

## Sicherheit

### Convex API Keys

**❌ NIEMALS im Frontend hardcoden:**

```typescript
// ❌ FALSCH
const CONVEX_KEY = "sk_1234567890";
```

**✅ Aus Backend Config holen:**

```typescript
// ✅ RICHTIG
const getConvexConfig = async () => {
  const response = await fetch("/admin-ng/config/plugin-keys", {
    credentials: "include", // Mit Opencast Auth
  });
  return response.json();
};
```

### Row-Level Security in Convex

```typescript
// convex/auth.ts
export const getUserId = async (ctx: QueryCtx): Promise<string | null> => {
  // Validate Opencast session token
  const token = ctx.auth.getToken();
  if (!token) return null;
  
  // Verify with Opencast backend
  const response = await fetch(`${OPENCAST_URL}/api/security/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!response.ok) return null;
  
  const user = await response.json();
  return user.username;
};
```

```typescript
// convex/quiz.ts - Mit Auth
export const getMySubmission = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    
    return await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .first();
  },
});
```

## Datenfluss: Hybrid-Ansatz

### Read-Operationen

```
User Request
    ↓
Frontend Plugin
    ↓
┌─────────────┬──────────────┐
│ GraphQL     │ Convex       │
│ (Opencast)  │ (Plugin DB)  │
└─────────────┴──────────────┘
    ↓              ↓
Event Metadata  Quiz Data
    ↓              ↓
    └──────┬──────┘
           ↓
    Combined UI
```

### Write-Operationen

```
User Submits Quiz
    ↓
Frontend Plugin
    ↓
Convex Mutation
    ↓
Convex Database
    ↓
Real-time Update
    ↓
All connected clients
```

## Vorteile des Hybrid-Ansatzes

### GraphQL (Opencast)
- ✅ Event-Metadaten (Title, Creator, etc.)
- ✅ User-Informationen
- ✅ Berechtigungen
- ✅ Konsistente Datenquelle

### Convex (Plugin)
- ✅ Schnelle Entwicklung (kein Backend nötig)
- ✅ Real-time Updates
- ✅ Flexible Schema-Änderungen
- ✅ Skalierbar

## Beispiel: Poll Plugin (Hybrid)

```typescript
// Frontend: Poll Plugin
const PollView = ({ eventId }: { eventId: string }) => {
  // Event info from GraphQL
  const { data: event } = useGetEventByIdQuery({ eventId });
  
  // Poll data from Convex
  const poll = useQuery(api.polls.getPoll, { eventId });
  const myVote = useQuery(api.polls.getMyVote, { 
    eventId, 
    userId: currentUser?.username 
  });
  const liveResults = useQuery(api.polls.getResults, { eventId });
  
  const vote = useMutation(api.polls.vote);
  
  // Real-time results update automatically!
  
  return (
    <div>
      <h1>{event?.title}</h1>
      <PollComponent 
        poll={poll}
        myVote={myVote}
        results={liveResults}
        onVote={async (optionId) => {
          await vote({
            eventId,
            userId: currentUser?.username,
            optionId,
          });
        }}
      />
    </div>
  );
};
```

## Migration Path

### Phase 1: Prototyping (Convex only)
- Schnelle Entwicklung
- Real-time Features
- Keine Backend-Änderungen

### Phase 2: Production (Hybrid)
- Event-Daten aus GraphQL
- Plugin-Daten in Convex
- Best of both worlds

### Phase 3: Optional (Full Opencast)
- Migration zu Opencast Backend
- Wenn Convex-Kosten zu hoch
- Wenn Daten zentral sein müssen

## Zusammenfassung

**GraphQL Extensions:**
- ✅ Möglich über `@GraphQLTypeExtension`
- ✅ Erfordert Backend-Modul (Java/OSGi)
- ✅ Ideal für Event/Series-Metadaten
- ✅ **Keine Opencast Core-Änderungen nötig!** Alles in `management-graphql`

**Neue Mutations hinzufügen:**
- ✅ Direkt in `MuiMutation` hinzufügen
- ✅ Opencast Services über `OpencastContext` nutzen
- ✅ Eigene Services als OSGi Components erstellen
- ✅ **Keine Opencast Core-Änderungen nötig!**

**Siehe:** `docs/GRAPHQL_MUTATIONS_EXTENDING.md` für detaillierte Anleitung.

**Hybrid-Ansatz (GraphQL + Convex):**
- ✅ GraphQL für Opencast-Daten (Events, Users)
- ✅ Convex für Plugin-Daten (Quiz, Polls)
- ✅ Real-time Updates out-of-the-box
- ✅ Schnelle Entwicklung ohne Backend-Änderungen
- ✅ Beste Lösung für Community-Plugins

**Empfehlung:** 
- **Für Mutations mit Opencast-Daten:** GraphQL Extensions in `management-graphql`
- **Für Plugin-spezifische Daten:** Hybrid-Ansatz (GraphQL + Convex)
