# ---- build stage ----
FROM gradle:8.10.2-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test

# ---- run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Render uses PORT env var (default 10000)
ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar --spring.profiles.active=render-nodb"]
