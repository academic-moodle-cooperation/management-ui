# Beispiel: Neue GraphQL Mutation hinzufügen

## Schritt-für-Schritt Anleitung

Dieses Beispiel zeigt, wie du eine neue Mutation `submitFeedback` zu `MuiMutation` hinzufügst.

## Schritt 1: Input Type definieren

```java
// backend/management-graphql/src/main/java/org/opencastproject/management/graphql/type/input/FeedbackInput.java

package org.opencastproject.management.graphql.type.input;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;

@GraphQLName("FeedbackInput")
public class FeedbackInput {
  
  @GraphQLField
  @GraphQLNonNull
  private String category; // "bug", "feature", etc.
  
  @GraphQLField
  private Integer rating; // 1-5
  
  @GraphQLField
  private String subject;
  
  @GraphQLField
  @GraphQLNonNull
  private String message;
  
  @GraphQLField
  private Boolean includeSystemInfo;
  
  // Getters and Setters
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  
  public Integer getRating() { return rating; }
  public void setRating(Integer rating) { this.rating = rating; }
  
  public String getSubject() { return subject; }
  public void setSubject(String subject) { this.subject = subject; }
  
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  
  public Boolean getIncludeSystemInfo() { return includeSystemInfo; }
  public void setIncludeSystemInfo(Boolean includeSystemInfo) { 
    this.includeSystemInfo = includeSystemInfo; 
  }
}
```

## Schritt 2: Return Type definieren

```java
// backend/management-graphql/src/main/java/org/opencastproject/management/graphql/type/FeedbackSubmissionResult.java

package org.opencastproject.management.graphql.type;

import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;

@GraphQLName("FeedbackSubmissionResult")
public class FeedbackSubmissionResult {
  
  private final boolean success;
  private final String feedbackId;
  private final String message;
  
  public FeedbackSubmissionResult(boolean success, String feedbackId, String message) {
    this.success = success;
    this.feedbackId = feedbackId;
    this.message = message;
  }
  
  @GraphQLField
  public boolean getSuccess() {
    return success;
  }
  
  @GraphQLField
  public String getFeedbackId() {
    return feedbackId;
  }
  
  @GraphQLField
  public String getMessage() {
    return message;
  }
}
```

## Schritt 3: Mutation zu MuiMutation hinzufügen

```java
// backend/management-graphql/src/main/java/org/opencastproject/management/graphql/MuiMutation.java

// ... bestehende Imports ...
import org.opencastproject.management.graphql.type.input.FeedbackInput;
import org.opencastproject.management.graphql.type.FeedbackSubmissionResult;

@GraphQLName(MuiMutation.TYPE_NAME)
public class MuiMutation {
  
  // ... bestehende Mutations ...
  
  @GraphQLField
  @GraphQLNonNull
  @GraphQLDescription("Submit user feedback")
  public static FeedbackSubmissionResult submitFeedback(
      @GraphQLName("feedback") @GraphQLNonNull FeedbackInput feedbackInput,
      final DataFetchingEnvironment environment) {
    
    try {
      // Get current user from environment
      User currentUser = environment.getContext();
      if (currentUser == null) {
        throw new GraphQLRuntimeException("User not authenticated");
      }
      
      // Get Opencast context for services
      OpencastContext context = OpencastContextManager.getCurrentContext();
      
      // Option A: Store in Opencast DB (würde FeedbackService benötigen)
      // FeedbackService feedbackService = context.getService(FeedbackService.class);
      // String feedbackId = feedbackService.save(feedbackInput, currentUser);
      
      // Option B: Store in external DB (Convex, etc.)
      // ConvexFeedbackService convexService = new ConvexFeedbackService();
      // String feedbackId = convexService.submit(feedbackInput, currentUser);
      
      // Option C: Simple HTTP endpoint (für externe DB)
      String feedbackId = submitToExternalService(feedbackInput, currentUser);
      
      return new FeedbackSubmissionResult(
        true,
        feedbackId,
        "Thank you for your feedback!"
      );
      
    } catch (Exception e) {
      throw new GraphQLRuntimeException("Failed to submit feedback: " + e.getMessage(), e);
    }
  }
  
  private static String submitToExternalService(FeedbackInput input, User user) {
    // Beispiel: HTTP Request zu externem Service
    // In Production: Würde zu Convex, Supabase, etc. gehen
    return "feedback-" + System.currentTimeMillis();
  }
}
```

## Schritt 4: Frontend GraphQL Mutation definieren

```graphql
# packages/query/src/queries.graphql

mutation SubmitFeedback($feedback: FeedbackInput!) {
  mui {
    submitFeedback(feedback: $feedback) {
      success
      feedbackId
      message
    }
  }
}
```

## Schritt 5: Codegen ausführen

```bash
cd packages/query
pnpm codegen
```

Dies generiert:
- TypeScript Types
- `useSubmitFeedbackMutation` Hook

## Schritt 6: Frontend nutzen

```typescript
// plugins/feedback-plugin/src/views/FeedbackView.tsx
import { useSubmitFeedbackMutation } from "@workspace/query";

const FeedbackView = () => {
  const submitFeedback = useSubmitFeedbackMutation();
  
  const handleSubmit = async (formData: FeedbackFormData) => {
    try {
      const result = await submitFeedback.mutate({
        feedback: {
          category: formData.category,
          rating: formData.rating,
          subject: formData.subject,
          message: formData.message,
          includeSystemInfo: formData.includeSystemInfo,
        },
      });
      
      if (result.data?.mui?.submitFeedback?.success) {
        // Success!
        console.log("Feedback ID:", result.data.mui.submitFeedback.feedbackId);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };
  
  // ...
};
```

## Erweiterte Option: Mit Opencast Services

Wenn du in Opencast DB speichern willst:

### 1. JPA Entity erstellen

```java
// backend/management-graphql/src/main/java/.../entity/FeedbackEntity.java

package org.opencastproject.management.graphql.entity;

import javax.persistence.*;

@Entity
@Table(name = "oc_plugin_feedback")
public class FeedbackEntity {
  
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  
  @Column(nullable = false)
  private String userId;
  
  @Column(nullable = false)
  private String category;
  
  @Column
  private Integer rating;
  
  @Column
  private String subject;
  
  @Column(columnDefinition = "TEXT", nullable = false)
  private String message;
  
  @Column(columnDefinition = "TEXT")
  private String systemInfoJson;
  
  @Temporal(TemporalType.TIMESTAMP)
  @Column(nullable = false)
  private Date submittedAt;
  
  // Getters/Setters...
}
```

### 2. Service erstellen

```java
// backend/management-graphql/src/main/java/.../service/FeedbackService.java

package org.opencastproject.management.graphql.service;

import org.opencastproject.management.graphql.entity.FeedbackEntity;
import org.opencastproject.management.graphql.type.input.FeedbackInput;
import org.opencastproject.security.api.User;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import java.util.Date;

@Component(service = FeedbackService.class)
public class FeedbackService {
  
  @Reference
  private EntityManagerFactory emf;
  
  public String save(FeedbackInput input, User user) {
    EntityManager em = emf.createEntityManager();
    em.getTransaction().begin();
    
    try {
      FeedbackEntity entity = new FeedbackEntity();
      entity.setUserId(user.getUsername());
      entity.setCategory(input.getCategory());
      entity.setRating(input.getRating());
      entity.setSubject(input.getSubject());
      entity.setMessage(input.getMessage());
      
      if (input.getIncludeSystemInfo()) {
        // System info als JSON speichern
        entity.setSystemInfoJson(getSystemInfoJson());
      }
      
      entity.setSubmittedAt(new Date());
      
      em.persist(entity);
      em.getTransaction().commit();
      
      return entity.getId().toString();
      
    } catch (Exception e) {
      em.getTransaction().rollback();
      throw new RuntimeException("Failed to save feedback", e);
    } finally {
      em.close();
    }
  }
  
  private String getSystemInfoJson() {
    // Collect system info...
    return "{}";
  }
}
```

### 3. In Mutation nutzen

```java
// In MuiMutation.java

@GraphQLField
public static FeedbackSubmissionResult submitFeedback(
    @GraphQLName("feedback") @GraphQLNonNull FeedbackInput feedbackInput,
    final DataFetchingEnvironment environment) {
  
  OpencastContext context = OpencastContextManager.getCurrentContext();
  FeedbackService feedbackService = context.getService(FeedbackService.class);
  
  User currentUser = environment.getContext();
  String feedbackId = feedbackService.save(feedbackInput, currentUser);
  
  return new FeedbackSubmissionResult(true, feedbackId, "Thank you!");
}
```

## Zusammenfassung

### ✅ Du kannst direkt in `management-graphql` erweitern:

1. **Input/Output Types** - Neue GraphQL Types definieren
2. **Mutations** - Zu `MuiMutation` hinzufügen
3. **Services** - Eigene Services erstellen (als OSGi Components)
4. **Entities** - JPA Entities für Opencast DB
5. **Commands** - Command Pattern für komplexe Logik

### ❌ Keine Opencast Core-Änderungen nötig!

Alles läuft als **Extension** über das `GraphQLExtensionProvider` System.

### 📝 Typischer Workflow:

1. Input/Output Types definieren
2. Mutation in `MuiMutation` hinzufügen
3. Service/Command implementieren (optional)
4. GraphQL Query/Mutation in Frontend definieren
5. `pnpm codegen` ausführen
6. Im Frontend nutzen

**Das `management-graphql` Modul ist vollständig erweiterbar ohne Opencast Core-Änderungen!** 🎉
