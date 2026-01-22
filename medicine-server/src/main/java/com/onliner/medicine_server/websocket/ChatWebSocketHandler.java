package com.onliner.medicine_server.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, Set<String>> sessionRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws IOException {
        String token = getQueryParam(session.getUri(), "token");
        if (token == null || token.isBlank()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("missing token"));
            return;
        }
        sessions.add(session);
        session.getAttributes().put("userId", token);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
        sessions.remove(session);
        Set<String> joined = sessionRooms.getOrDefault(session, Collections.emptySet());
        for (String roomId : joined) {
            leaveRoom(roomId, session);
        }
        sessionRooms.remove(session);
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws IOException {
        String payload = message.getPayload();
        String safePayload = payload == null ? "" : payload;
        Map<String, Object> data = parsePayload(safePayload);
        String type = String.valueOf(data.getOrDefault("type", "chat"));
        String roomId = String.valueOf(data.getOrDefault("roomId", ""));

        switch (type) {
            case "subscribe" -> {
                if (!roomId.isBlank()) {
                    joinRoom(roomId, session);
                }
            }
            case "unsubscribe" -> {
                if (!roomId.isBlank()) {
                    leaveRoom(roomId, session);
                }
            }
            case "read" -> {
                if (!roomId.isBlank()) {
                    data.putIfAbsent("readerId", session.getAttributes().get("userId"));
                    data.putIfAbsent("serverTimestamp", Instant.now().toString());
                    broadcastToRoom(roomId, objectMapper.writeValueAsString(data));
                }
            }
            default -> {
                if (!roomId.isBlank()) {
                    data.putIfAbsent("senderId", session.getAttributes().get("userId"));
                    data.putIfAbsent("serverTimestamp", Instant.now().toString());
                    broadcastToRoom(roomId, objectMapper.writeValueAsString(data));
                }
            }
        }
    }

    private Map<String, Object> parsePayload(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() {});
        } catch (Exception ignored) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("type", "chat");
            fallback.put("message", payload);
            return fallback;
        }
    }

    private void broadcastToRoom(String roomId, String payload) throws IOException {
        TextMessage outgoing = new TextMessage(payload == null ? "" : payload);
        for (WebSocketSession session : rooms.getOrDefault(roomId, Collections.emptySet())) {
            if (session.isOpen()) {
                session.sendMessage(outgoing);
            }
        }
    }

    private void joinRoom(String roomId, WebSocketSession session) {
        rooms.computeIfAbsent(roomId, key -> ConcurrentHashMap.newKeySet()).add(session);
        sessionRooms.computeIfAbsent(session, key -> ConcurrentHashMap.newKeySet()).add(roomId);
    }

    private void leaveRoom(String roomId, WebSocketSession session) {
        rooms.getOrDefault(roomId, Collections.emptySet()).remove(session);
        sessionRooms.getOrDefault(session, Collections.emptySet()).remove(roomId);
    }

    private String getQueryParam(URI uri, String key) {
        if (uri == null || uri.getQuery() == null) return null;
        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf('=');
            if (idx < 0) continue;
            String name = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
            if (!name.equals(key)) continue;
            return URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
        }
        return null;
    }
}
