# Plugin Database Strategies

## Übersicht

Plugins, die Daten speichern müssen (z.B. Quiz, Polls, Feedback, Bookmarks), haben mehrere Optionen für die Datenpersistierung. Diese Dokumentation analysiert verschiedene Ansätze und ihre Trade-offs.

## Optionen im Vergleich

### 1. Opencast Backend Database ⭐ **EMPFOHLEN für Production**

**Architektur:**
- Plugin-spezifische Backend-Endpoints in Opencast
- Nutzung der bestehenden Opencast-Datenbank
- JPA/Hibernate Entities für Datenmodell

**Vorteile:**
- ✅ **Zentralisiert:** Alle Daten in einer DB
- ✅ **Konsistent:** Einheitliche Backup- und Migration-Strategie
- ✅ **Sicherheit:** Nutzt bestehende Opencast-Sicherheitsmechanismen
- ✅ **Transaktionen:** ACID-Garantien über Opencast DB
- ✅ **Keine externe Abhängigkeit:** Alles selbst gehostet
- ✅ **Performance:** Lokale DB, keine Netzwerk-Latenz

**Nachteile:**
- ❌ **Backend-Entwicklung nötig:** Java-Endpoints müssen erstellt werden
- ❌ **Schema-Management:** Migrationen müssen koordiniert werden
- ❌ **Weniger flexibel:** Muss Opencast DB-Schema folgen
- ❌ **Längerer Entwicklungszyklus:** Backend + Frontend

**Geschätzter Aufwand:**
- Backend-Endpoints: 1-2 Wochen
- Database Schema: 2-3 Tage
- Migration Scripts: 1-2 Tage
- **Total: 2-3 Wochen**

**Beispiel-Implementierung:**

```java
// Backend: Plugin REST Endpoint
@Path("/admin-ng/quiz")
public class QuizEndpoint {
    
    @POST
    @Path("/submit")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response submitQuiz(QuizSubmission submission) {
        // Store in Opencast DB
        QuizEntity entity = new QuizEntity();
        entity.setEventId(submission.getEventId());
        entity.setAnswers(submission.getAnswers());
        entity.setUserId(getCurrentUser());
        quizService.save(entity);
        return Response.ok().build();
    }
    
    @GET
    @Path("/results/{eventId}")
    public QuizResults getResults(@PathParam("eventId") String eventId) {
        // Query from Opencast DB
        return quizService.getResults(eventId);
    }
}
```

```typescript
// Frontend Plugin
const submitQuiz = async (answers: QuizAnswers) => {
  const response = await fetch("/admin-ng/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, answers }),
  });
  return response.json();
};
```

---

### 2. Externe Database-as-a-Service (Convex, Supabase, Firebase) 🚀 **EMPFOHLEN für Prototyping**

**Architektur:**
- Plugin nutzt externe DB direkt vom Frontend
- Keine Backend-Änderungen nötig
- Real-time Updates möglich

**Vorteile:**
- ✅ **Schnell zu implementieren:** Kein Backend nötig
- ✅ **Real-time:** Live-Updates ohne Polling
- ✅ **Skalierbar:** Externe Services handhaben Skalierung
- ✅ **Flexibel:** Eigene Schema-Struktur
- ✅ **Modern:** GraphQL, REST, oder SDK-basiert
- ✅ **Schnelle Iteration:** Schema-Änderungen ohne Migrationen

**Nachteile:**
- ❌ **Externe Abhängigkeit:** Service muss verfügbar sein
- ❌ **Kosten:** Ab bestimmten Limits kostenpflichtig
- ❌ **Daten außerhalb Opencast:** Separate Backup-Strategie
- ❌ **Sicherheit:** API Keys müssen verwaltet werden
- ❌ **Latenz:** Netzwerk-Roundtrips
- ❌ **Vendor Lock-in:** Wechsel schwierig

**Geschätzter Aufwand:**
- Setup & Integration: 2-3 Tage
- Schema Design: 1 Tag
- Frontend Implementation: 1 Woche
- **Total: 1-2 Wochen**

**Beispiel-Implementierung (Convex):**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  quizSubmissions: defineTable({
    eventId: v.string(),
    userId: v.string(),
    answers: v.array(v.any()),
    timestamp: v.number(),
  }).index("by_event", ["eventId"]),
});

// Frontend Plugin
import { useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";

const QuizPlugin = () => {
  const submissions = useQuery(api.quiz.getSubmissions, { eventId });
  const submitQuiz = useMutation(api.quiz.submit);
  
  // Real-time updates automatically!
};
```

**Beispiel-Implementierung (Supabase):**

```typescript
// Frontend Plugin
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const submitQuiz = async (answers: QuizAnswers) => {
  const { data, error } = await supabase
    .from("quiz_submissions")
    .insert({ eventId, userId, answers });
};

// Real-time subscription
supabase
  .channel("quiz-updates")
  .on("postgres_changes", { 
    event: "INSERT", 
    schema: "public", 
    table: "quiz_submissions" 
  }, (payload) => {
    // Handle real-time update
  })
  .subscribe();
```

---

### 3. Hybrid: Opencast Backend + Externe DB für Analytics

**Architektur:**
- Kritische Daten in Opencast DB
- Analytics/Metrics in externer DB
- Best of both worlds

**Vorteile:**
- ✅ **Flexibel:** Richtige DB für richtigen Use Case
- ✅ **Performance:** Analytics nicht auf Opencast DB
- ✅ **Skalierbar:** Externe DB für große Datenmengen

**Nachteile:**
- ❌ **Komplexer:** Zwei Systeme zu verwalten
- ❌ **Konsistenz:** Daten können auseinanderlaufen

---

### 4. Browser LocalStorage / IndexedDB (Nur für Client-only Features)

**Architektur:**
- Daten nur im Browser gespeichert
- Keine Server-Synchronisation

**Vorteile:**
- ✅ **Keine Backend nötig**
- ✅ **Sofort verfügbar**
- ✅ **Offline-fähig**

**Nachteile:**
- ❌ **Nur lokal:** Nicht zwischen Geräten synchronisiert
- ❌ **Begrenzt:** ~5-10MB Speicher
- ❌ **Nicht persistent:** Kann gelöscht werden

**Use Cases:**
- User-Präferenzen
- Temporäre Notizen
- Client-side Caching

---

## Empfehlungen nach Use Case

### Quiz Plugin

**Empfehlung: Opencast Backend Database**

**Begründung:**
- Quiz-Ergebnisse sind wichtige Daten, die zu Events gehören
- Sollten in Opencast-Backups enthalten sein
- Müssen mit Opencast-Benutzern verknüpft sein
- Möglicherweise für Analytics/Reporting benötigt

**Implementierung:**
```java
// Backend Entity
@Entity
@Table(name = "oc_quiz_submission")
public class QuizSubmission {
    @Id
    @GeneratedValue
    private Long id;
    
    @Column(nullable = false)
    private String eventId;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(columnDefinition = "TEXT")
    private String answersJson; // JSON der Antworten
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedAt;
    
    private Integer score;
}
```

### Poll Plugin

**Empfehlung: Opencast Backend Database** (für Production) oder **Convex/Supabase** (für schnelles Prototyping)

**Begründung:**
- Polls sind Event-bezogen
- Real-time Updates wären nice-to-have
- Für Production: Opencast DB für Konsistenz
- Für Prototyping: Externe DB für Geschwindigkeit

### Feedback Plugin

**Empfehlung: Opencast Backend Database**

**Begründung:**
- Feedback sollte zentral gespeichert werden
- Muss mit Opencast-Benutzern verknüpft sein
- Sollte in Backups enthalten sein

### Bookmarks/Favorites Plugin

**Empfehlung: Opencast Backend Database**

**Begründung:**
- User-Daten gehören in Opencast
- Muss mit Opencast-Authentifizierung verknüpft sein

### Analytics Dashboard Plugin

**Empfehlung: Hybrid (Opencast + Externe DB)**

**Begründung:**
- Event-Daten aus Opencast
- Aggregierte Analytics in externer DB (z.B. TimescaleDB, InfluxDB)
- Real-time Dashboards profitieren von spezialisierten DBs

---

## Implementierungs-Guide: Opencast Backend Database

### Schritt 1: Database Schema

```sql
-- Migration Script
CREATE TABLE oc_plugin_quiz_submission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    answers_json TEXT,
    score INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event (event_id),
    INDEX idx_user (user_id)
);
```

### Schritt 2: JPA Entity

```java
package org.opencastproject.plugin.quiz;

import javax.persistence.*;

@Entity
@Table(name = "oc_plugin_quiz_submission")
public class QuizSubmissionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "event_id", nullable = false)
    private String eventId;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;
    
    @Column(name = "score")
    private Integer score;
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "submitted_at")
    private Date submittedAt;
    
    // Getters/Setters...
}
```

### Schritt 3: REST Endpoint

```java
package org.opencastproject.plugin.quiz;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/admin-ng/quiz")
public class QuizEndpoint {
    
    private QuizService quizService;
    
    @POST
    @Path("/submit")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response submitQuiz(QuizSubmissionDto dto) {
        try {
            QuizSubmissionEntity entity = new QuizSubmissionEntity();
            entity.setEventId(dto.getEventId());
            entity.setUserId(getCurrentUser().getUsername());
            entity.setAnswersJson(new ObjectMapper().writeValueAsString(dto.getAnswers()));
            entity.setScore(calculateScore(dto.getAnswers()));
            entity.setSubmittedAt(new Date());
            
            quizService.save(entity);
            
            return Response.ok().entity(Map.of("success", true, "score", entity.getScore())).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }
    }
    
    @GET
    @Path("/results/{eventId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getResults(@PathParam("eventId") String eventId) {
        List<QuizSubmissionEntity> submissions = quizService.findByEventId(eventId);
        // Aggregate results...
        return Response.ok().entity(results).build();
    }
}
```

### Schritt 4: Frontend Plugin

```typescript
// .local-plugins/quiz-plugin/src/services/quizApi.ts
export const submitQuiz = async (eventId: string, answers: QuizAnswers) => {
  const response = await fetch("/admin-ng/quiz/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, answers }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to submit quiz");
  }
  
  return response.json();
};

export const getQuizResults = async (eventId: string) => {
  const response = await fetch(`/admin-ng/quiz/results/${eventId}`);
  return response.json();
};
```

---

## Implementierungs-Guide: Externe DB (Convex Beispiel)

### Schritt 1: Convex Setup

```bash
npm install convex
npx convex dev
```

### Schritt 2: Schema definieren

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  quizSubmissions: defineTable({
    eventId: v.string(),
    userId: v.string(),
    answers: v.array(v.any()),
    score: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"]),
});
```

### Schritt 3: Functions erstellen

```typescript
// convex/quiz.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    eventId: v.string(),
    userId: v.string(),
    answers: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const score = calculateScore(args.answers);
    return await ctx.db.insert("quizSubmissions", {
      eventId: args.eventId,
      userId: args.userId,
      answers: args.answers,
      score,
      submittedAt: Date.now(),
    });
  },
});

export const getByEvent = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizSubmissions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});
```

### Schritt 4: Frontend Integration

```typescript
// .local-plugins/quiz-plugin/src/views/QuizView.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const QuizView = ({ eventId }: { eventId: string }) => {
  const submissions = useQuery(api.quiz.getByEvent, { eventId });
  const submitQuiz = useMutation(api.quiz.submit);
  
  // Real-time updates automatically!
  // submissions updates when new data arrives
  
  const handleSubmit = async (answers: QuizAnswers) => {
    await submitQuiz({
      eventId,
      userId: getCurrentUser().username,
      answers,
    });
  };
  
  // ...
};
```

---

## Sicherheitsüberlegungen

### Opencast Backend

- ✅ Nutzt bestehende Opencast-Authentifizierung
- ✅ Role-based Access Control (RBAC) möglich
- ✅ Daten sind in Opencast-Sicherheitskontext

### Externe DB

- ⚠️ **API Keys sicher speichern:**
  ```typescript
  // ❌ NIEMALS hardcoden
  const key = "sk_1234567890";
  
  // ✅ Aus Environment Variable
  const key = import.meta.env.VITE_CONVEX_KEY;
  
  // ✅ Oder aus Backend-Config
  const { data: config } = await fetch("/admin-ng/config/plugin-keys");
  ```
  
- ⚠️ **Row-Level Security (RLS) konfigurieren:**
  ```sql
  -- Supabase Beispiel
  CREATE POLICY "Users can only see their own submissions"
  ON quiz_submissions
  FOR SELECT
  USING (auth.uid() = user_id);
  ```

---

## Kostenvergleich

### Opencast Backend Database
- **Kosten:** €0 (selbst gehostet)
- **Skalierung:** Abhängig von Opencast-Infrastruktur

### Convex
- **Free Tier:** 1M Function Calls/Monat, 1GB Storage
- **Paid:** $25/Monat für mehr

### Supabase
- **Free Tier:** 500MB Database, 2GB Bandwidth
- **Paid:** $25/Monat für mehr

### Firebase
- **Free Tier:** 1GB Storage, 10GB Bandwidth
- **Paid:** Pay-as-you-go

---

## Hybrid-Ansatz: GraphQL + Convex ⭐ **EMPFOHLEN**

### Beste Lösung für Community-Plugins

**Architektur:**
- **GraphQL (Opencast):** Event-Metadaten, User-Info, Read-only Daten
- **Convex:** Plugin-spezifische Daten (Quiz, Polls) mit Real-time Updates

**Vorteile:**
- ✅ **Event-Daten aus GraphQL:** Nutzt bestehende Opencast-Daten
- ✅ **Plugin-Daten in Convex:** Schnelle Entwicklung, Real-time
- ✅ **Keine Backend-Änderungen:** Für Plugin-Daten
- ✅ **GraphQL Extensions möglich:** Falls Metadaten in GraphQL gewünscht

**Siehe:** `../PLUGIN_GRAPHQL_EXTENSIONS.md` und `QUIZ_PLUGIN_HYBRID_EXAMPLE.md` für vollständige Implementierung.

## Finale Empfehlung

### Für Community-Plugins: **Hybrid (GraphQL + Convex)** ⭐

**Gründe:**
1. Schnelle Entwicklung ohne Backend-Änderungen
2. Real-time Updates out-of-the-box
3. Nutzt Opencast-Daten über GraphQL
4. Flexible Schema-Änderungen
5. Beste Lösung für Community-Entwicklung

### Für Core-Features: **Opencast Backend Database**

**Gründe:**
1. Daten gehören zu Opencast und sollten zentral sein
2. Konsistente Backup-Strategie
3. Nutzt bestehende Sicherheitsinfrastruktur
4. Keine externen Abhängigkeiten

### Migration Path

1. **Phase 1:** Prototyp mit Hybrid-Ansatz (GraphQL + Convex)
2. **Phase 2:** Validierung mit Usern
3. **Phase 3:** Optional - Migration zu Opencast Backend für Core-Features

---

## Best Practices

1. **Abstraktion:** Database-Layer abstrahieren
   ```typescript
   // .local-plugins/quiz-plugin/src/services/quizStorage.ts
   interface QuizStorage {
     submit(eventId: string, answers: QuizAnswers): Promise<QuizResult>;
     getResults(eventId: string): Promise<QuizResults>;
   }
   
   // Kann zwischen Opencast Backend und externer DB wechseln
   ```

2. **Error Handling:** Robustes Error Handling
   ```typescript
   try {
     await submitQuiz(answers);
   } catch (error) {
     if (error instanceof NetworkError) {
       // Retry logic
     } else if (error instanceof ValidationError) {
       // Show user-friendly message
     }
   }
   ```

3. **Caching:** Client-side Caching für Performance
   ```typescript
   const { data, isLoading } = useQuery({
     queryKey: ["quiz-results", eventId],
     queryFn: () => getQuizResults(eventId),
     staleTime: 30 * 1000, // Cache for 30s
   });
   ```

4. **Offline Support:** Für externe DBs, Offline-First Pattern
   ```typescript
   // Queue submissions when offline
   if (navigator.onLine) {
     await submitQuiz(answers);
   } else {
     queueSubmission(answers);
   }
   ```

---

## Zusammenfassung

| Kriterium | Opencast DB | Externe DB (Convex/Supabase) |
|-----------|-------------|------------------------------|
| **Aufwand** | 2-3 Wochen | 1-2 Wochen |
| **Kosten** | €0 | €0-25/Monat |
| **Sicherheit** | ✅ Hoch | ⚠️ Abhängig von Konfiguration |
| **Skalierung** | Opencast-limitiert | ✅ Extern skaliert |
| **Real-time** | ❌ Polling nötig | ✅ Out-of-the-box |
| **Wartbarkeit** | ✅ Langfristig | ⚠️ Vendor Lock-in |
| **Empfehlung** | ✅ Production | ✅ Prototyping |

**Finale Empfehlung:** Starte mit externer DB für schnelles Prototyping, migriere zu Opencast Backend für Production.
