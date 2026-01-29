# GraphQL Mutations erweitern

## Kurze Antwort

**Ja, du kannst Mutations direkt in `backend/management-graphql` hinzufügen, ohne Opencast Core zu ändern!**

Das `management-graphql` Modul ist ein **OSGi Bundle**, das als Extension zu Opencast's GraphQL-System läuft. Du kannst:

1. ✅ **Neue Mutations hinzufügen** - Direkt in `MuiMutation` oder neue Mutation-Klasse
2. ✅ **Opencast Services nutzen** - Über OSGi Dependency Injection (`@Reference`)
3. ✅ **Bestehende Commands nutzen** - Oder eigene Commands erstellen
4. ✅ **Keine Opencast Core-Änderungen** - Alles läuft als Extension

## Architektur

```
┌─────────────────────────────────────────┐
│  Opencast Core                           │
│  ┌─────────────────────────────────────┐ │
│  │ opencast-graphql                    │ │
│  │ - GraphQL Schema                    │ │
│  │ - GraphQLExtensionProvider         │ │
│  │ - Base Types (Event, Series, etc.)  │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↑
              │ Extension
              │
┌─────────────────────────────────────────┐
│  management-graphql (Dein Modul)        │
│  ┌─────────────────────────────────────┐ │
│  │ MuiMutationExtension                │ │
│  │ MuiMutation                          │ │
│  │ MuiEventExtension                    │ │
│  │ Commands (MuiUpdateEventCommand)    │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Wie es funktioniert

### 1. GraphQL Extension System

Opencast's GraphQL nutzt ein **Extension-System**:

- `GraphQLExtensionProvider` Interface - Wird von Opencast automatisch erkannt
- `@GraphQLTypeExtension` - Erweitert bestehende Types
- OSGi Component Registration - Automatische Integration

### 2. Dein Modul erweitert Opencast

```java
// backend/management-graphql/src/main/java/.../GraphQLProvider.java
@Component
public class GraphQLProvider implements GraphQLExtensionProvider {
  // Wird automatisch von Opencast erkannt und registriert!
}
```

## Neue Mutations hinzufügen

### Beispiel 1: Einfache Mutation (ohne Opencast Services)

```java
// backend/management-graphql/src/main/java/.../MuiMutation.java

@GraphQLName(MuiMutation.TYPE_NAME)
public class MuiMutation {
  
  // ... bestehende Mutations ...
  
  @GraphQLField
  @GraphQLDescription("Submit quiz answers")
  public static QuizSubmissionResult submitQuiz(
      @GraphQLName("eventId") @GraphQLNonNull String eventId,
      @GraphQLName("answers") @GraphQLNonNull QuizAnswersInput answers,
      final DataFetchingEnvironment environment) {
    
    // Deine Logik hier
    // Kann direkt auf Opencast Services zugreifen über OpencastContext
    OpencastContext context = OpencastContextManager.getCurrentContext();
    
    // Beispiel: Quiz in externe DB speichern (Convex, etc.)
    // Oder: In Opencast DB speichern (siehe Beispiel 2)
    
    return new QuizSubmissionResult(true, 85);
  }
}
```

### Beispiel 2: Mutation mit Opencast Services

```java
// backend/management-graphql/src/main/java/.../MuiMutation.java

@GraphQLName(MuiMutation.TYPE_NAME)
public class MuiMutation {
  
  @GraphQLField
  @GraphQLDescription("Create a quiz for an event")
  public static QuizDefinition createQuiz(
      @GraphQLName("eventId") @GraphQLNonNull String eventId,
      @GraphQLName("quiz") @GraphQLNonNull QuizInput quizInput,
      final DataFetchingEnvironment environment) {
    
    // Opencast Context für Services
    OpencastContext context = OpencastContextManager.getCurrentContext();
    
    // Beispiel: Event validieren
    IndexService indexService = context.getService(IndexService.class);
    Event event = indexService.getEvent(eventId, context.getOrganization());
    if (event == null) {
      throw new GraphQLRuntimeException("Event not found: " + eventId);
    }
    
    // Beispiel: Quiz in Opencast DB speichern
    // (würde JPA Entity + Service benötigen)
    QuizService quizService = context.getService(QuizService.class);
    QuizEntity quiz = quizService.createQuiz(eventId, quizInput);
    
    return new QuizDefinition(quiz);
  }
}
```

### Beispiel 3: Mutation mit Command Pattern (wie bestehende)

```java
// backend/management-graphql/src/main/java/.../command/MuiCreateQuizCommand.java

public class MuiCreateQuizCommand {
  
  private final String eventId;
  private final QuizInput quizInput;
  private DataFetchingEnvironment environment;
  
  public static Builder create(String eventId, QuizInput quizInput) {
    return new Builder(eventId, quizInput);
  }
  
  public static class Builder {
    private final String eventId;
    private final QuizInput quizInput;
    private DataFetchingEnvironment environment;
    
    public Builder(String eventId, QuizInput quizInput) {
      this.eventId = eventId;
      this.quizInput = quizInput;
    }
    
    public Builder environment(DataFetchingEnvironment env) {
      this.environment = env;
      return this;
    }
    
    public QuizDefinition execute() {
      OpencastContext context = OpencastContextManager.getCurrentContext();
      
      // Validierung
      IndexService indexService = context.getService(IndexService.class);
      Event event = indexService.getEvent(eventId, context.getOrganization());
      if (event == null) {
        throw new GraphQLRuntimeException("Event not found");
      }
      
      // Quiz erstellen
      QuizService quizService = context.getService(QuizService.class);
      QuizEntity entity = quizService.create(eventId, quizInput);
      
      return new QuizDefinition(entity);
    }
  }
}

// In MuiMutation.java
@GraphQLField
@GraphQLDescription("Create a quiz for an event")
public static QuizDefinition createQuiz(
    @GraphQLName("eventId") @GraphQLNonNull String eventId,
    @GraphQLName("quiz") @GraphQLNonNull QuizInput quizInput,
    final DataFetchingEnvironment environment) {
  return MuiCreateQuizCommand
      .create(eventId, quizInput)
      .environment(environment)
      .execute();
}
```

## Opencast Services nutzen

### Verfügbare Services

Über `OpencastContext` kannst du auf alle Opencast Services zugreifen:

```java
OpencastContext context = OpencastContextManager.getCurrentContext();

// Index Service (Events, Series)
IndexService indexService = context.getService(IndexService.class);

// Workflow Service
WorkflowService workflowService = context.getService(WorkflowService.class);

// Security Service
SecurityService securityService = context.getService(SecurityService.class);

// Asset Manager
AssetManager assetManager = context.getService(AssetManager.class);

// ACL Service
AclService aclService = context.getService(AclServiceFactory.class)
    .serviceFor(context.getOrganization());
```

### Service per Dependency Injection (Alternative)

```java
@Component(service = QuizMutation.class)
public class QuizMutation {
  
  @Reference
  private IndexService indexService;
  
  @Reference
  private WorkflowService workflowService;
  
  @GraphQLField
  public QuizDefinition createQuiz(String eventId, QuizInput input) {
    // Services sind bereits injiziert
    Event event = indexService.getEvent(eventId, ...);
    // ...
  }
}
```

## Wann brauchst du Opencast Core-Änderungen?

### ❌ NICHT nötig für:

- ✅ Neue Mutations
- ✅ Neue Queries
- ✅ Type Extensions
- ✅ Nutzung bestehender Opencast Services
- ✅ Eigene Commands

### ⚠️ NUR nötig wenn:

- ❌ **Neue Opencast Services** benötigt werden
- ❌ **Neue Database Entities** in Opencast DB (dann brauchst du JPA Entities)
- ❌ **Core GraphQL Schema-Änderungen** (neue Base Types)

## Beispiel: Quiz Mutation (Vollständig)

### 1. Input Types definieren

```java
// backend/management-graphql/src/main/java/.../type/input/QuizInput.java

@GraphQLName("QuizInput")
public class QuizInput {
  
  @GraphQLField
  @GraphQLNonNull
  private String title;
  
  @GraphQLField
  private String description;
  
  @GraphQLField
  @GraphQLNonNull
  private List<QuestionInput> questions;
  
  // Getters/Setters...
}

@GraphQLName("QuestionInput")
public class QuestionInput {
  
  @GraphQLField
  @GraphQLNonNull
  private String question;
  
  @GraphQLField
  @GraphQLNonNull
  private String type; // "multiple_choice", "text", etc.
  
  @GraphQLField
  private List<String> options;
  
  @GraphQLField
  private Object correctAnswer;
  
  @GraphQLField
  @GraphQLNonNull
  private Integer points;
  
  // Getters/Setters...
}
```

### 2. Return Types definieren

```java
// backend/management-graphql/src/main/java/.../type/QuizDefinition.java

@GraphQLName("QuizDefinition")
public class QuizDefinition {
  
  private final QuizEntity entity;
  
  public QuizDefinition(QuizEntity entity) {
    this.entity = entity;
  }
  
  @GraphQLField
  public String getId() {
    return entity.getId().toString();
  }
  
  @GraphQLField
  public String getEventId() {
    return entity.getEventId();
  }
  
  @GraphQLField
  public String getTitle() {
    return entity.getTitle();
  }
  
  @GraphQLField
  public List<Question> getQuestions() {
    return entity.getQuestions().stream()
        .map(Question::new)
        .collect(Collectors.toList());
  }
}
```

### 3. Mutation implementieren

```java
// backend/management-graphql/src/main/java/.../MuiMutation.java

@GraphQLField
@GraphQLDescription("Create a quiz for an event")
public static QuizDefinition createQuiz(
    @GraphQLName("eventId") @GraphQLNonNull String eventId,
    @GraphQLName("quiz") @GraphQLNonNull QuizInput quizInput,
    final DataFetchingEnvironment environment) {
  
  OpencastContext context = OpencastContextManager.getCurrentContext();
  
  // 1. Event validieren
  IndexService indexService = context.getService(IndexService.class);
  Event event = indexService.getEvent(eventId, context.getOrganization());
  if (event == null) {
    throw new GraphQLRuntimeException("Event not found: " + eventId);
  }
  
  // 2. User validieren (aus environment)
  User currentUser = environment.getContext();
  if (currentUser == null) {
    throw new GraphQLRuntimeException("User not authenticated");
  }
  
  // 3. Quiz erstellen (in Opencast DB oder externe DB)
  // Option A: Opencast DB
  QuizService quizService = context.getService(QuizService.class);
  QuizEntity entity = quizService.create(eventId, quizInput, currentUser);
  
  // Option B: Externe DB (Convex, etc.)
  // ConvexQuizService convexService = new ConvexQuizService();
  // QuizEntity entity = convexService.create(eventId, quizInput);
  
  return new QuizDefinition(entity);
}
```

## Database-Integration

### Option A: Opencast Database (JPA)

Wenn du in Opencast DB speichern willst:

```java
// 1. JPA Entity erstellen
@Entity
@Table(name = "oc_plugin_quiz")
public class QuizEntity {
  @Id
  @GeneratedValue
  private Long id;
  
  @Column(nullable = false)
  private String eventId;
  
  @Column(columnDefinition = "TEXT")
  private String quizJson; // JSON der Quiz-Definition
  
  // ...
}

// 2. Service erstellen
@Component(service = QuizService.class)
public class QuizService {
  
  @Reference
  private EntityManagerFactory emf;
  
  public QuizEntity create(String eventId, QuizInput input) {
    EntityManager em = emf.createEntityManager();
    // JPA Operations...
  }
}
```

### Option B: Externe Database (Convex, etc.)

```java
// Service für externe DB
public class ConvexQuizService {
  
  private final String convexUrl;
  private final String convexKey;
  
  public QuizEntity create(String eventId, QuizInput input) {
    // HTTP Request zu Convex
    // Oder Convex Java SDK nutzen
    // ...
  }
}
```

## Frontend: GraphQL Query/Mutation

### Mutation definieren

```graphql
# packages/query/src/queries.graphql

mutation CreateQuiz($eventId: String!, $quiz: QuizInput!) {
  mui {
    createQuiz(eventId: $eventId, quiz: $quiz) {
      id
      eventId
      title
      questions {
        id
        question
        type
        points
      }
    }
  }
}
```

### Frontend nutzen

```typescript
import { useCreateQuizMutation } from "@workspace/query";

const QuizCreator = () => {
  const createQuiz = useCreateQuizMutation();
  
  const handleSubmit = async (quizData: QuizInput) => {
    const result = await createQuiz.mutate({
      eventId: "event-123",
      quiz: quizData,
    });
    
    console.log("Quiz created:", result.data?.mui?.createQuiz);
  };
  
  // ...
};
```

## Zusammenfassung

### ✅ Du kannst direkt in `management-graphql` erweitern:

1. **Neue Mutations** - Einfach zu `MuiMutation` hinzufügen
2. **Neue Commands** - Eigene Command-Klassen erstellen
3. **Opencast Services nutzen** - Über `OpencastContext`
4. **Type Extensions** - Bestehende Types erweitern
5. **Input/Output Types** - Eigene GraphQL Types definieren

### ❌ Opencast Core-Änderungen nur nötig wenn:

- Neue Opencast Services benötigt werden
- Neue Core Database Entities (aber das kannst du auch in `management-graphql` machen)
- Core GraphQL Schema-Änderungen

### 📝 Workflow:

1. **Mutation in `MuiMutation.java` hinzufügen**
2. **Command erstellen** (optional, für komplexe Logik)
3. **GraphQL Query/Mutation in Frontend definieren**
4. **Codegen ausführen** (`pnpm codegen`)
5. **Im Frontend nutzen**

**Alles läuft als Extension - keine Opencast Core-Änderungen nötig!** 🎉
