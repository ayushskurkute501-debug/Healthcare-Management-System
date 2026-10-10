# Healthcare Management System – Backend

Spring Boot 3.3 REST API for departments, doctors, patients, and appointments.

## Requirements

- **Java 17** (or a newer JDK that supports `--release 17`)
- **Maven 3.8+**
- Optional: MySQL 8 (only for `prod` profile)

## Quick start (H2 in-memory – recommended)

```bash
cd backend
java -version   # should show 17.x

# If needed on Linux:
# export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
# export PATH=$JAVA_HOME/bin:$PATH

mvn spring-boot:run
```

App: **http://localhost:8080**

```bash
curl http://localhost:8080/api/health
# Healthcare Management System API is running
```

H2 console: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:healthcare`
- User: `sa` / Password: (empty)

## Run tests

```bash
cd backend
mvn test
```

## Build & run JAR

```bash
cd backend
mvn -DskipTests package
java -jar target/healthcare-management-backend-1.0.0.jar
```

## Production (MySQL)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
# or
java -jar target/healthcare-management-backend-1.0.0.jar --spring.profiles.active=prod
```

Env overrides: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`

Default profile is **dev** (H2). Seed data loads on first start.
