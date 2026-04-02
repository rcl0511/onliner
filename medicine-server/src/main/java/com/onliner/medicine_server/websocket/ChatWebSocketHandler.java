package com.onliner.medicine_server.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onliner.medicine_server.Repository.ChatMessageRepository;
import com.onliner.medicine_server.auth.JwtService;
import com.onliner.medicine_server.entity.ChatMessage;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, Set<String>> sessionRooms = new ConcurrentHashMap<>();
    private final JwtService jwtService;

    @Nullable
    private final ChatMessageRepository chatMessageRepository;

    public ChatWebSocketHandler(JwtService jwtService, @Nullable ChatMessageRepository chatMessageRepository) {
        this.jwtService = jwtService;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws IOException {
        String token = getQueryParam(session.getUri(), "token");
        if (token == null || token.isBlank()) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("missing token"));
            return;
        }
        try {
            Claims claims = jwtService.parseToken(token);
            String subject = claims.getSubject();
            String role = claims.get("role", String.class);
            session.getAttributes().put("userId", subject);
            session.getAttributes().put("role", role);
        } catch (JwtException ex) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("invalid token"));
            return;
        }
        sessions.add(session);
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
                    String senderId = String.valueOf(session.getAttributes().getOrDefault("userId", "unknown"));
                    data.putIfAbsent("senderId", senderId);
                    data.putIfAbsent("serverTimestamp", Instant.now().toString());

                    // DB 저장
                    saveToDb(roomId, senderId, data);

                    broadcastToRoom(roomId, objectMapper.writeValueAsString(data));
                }
            }
        }
    }

    private void saveToDb(String roomId, String senderId, Map<String, Object> data) {
        if (chatMessageRepository == null) return;
        try {
            String senderName = String.valueOf(data.getOrDefault("senderName", senderId));
            String messageText = String.valueOf(data.getOrDefault("message", ""));
            String messageType = String.valueOf(data.getOrDefault("messageType", "text"));

            ChatMessage entity = ChatMessage.builder()
                    .roomId(roomId)
                    .senderId(senderId)
                    .senderName(senderName)
                    .message(messageText)
                    .messageType(messageType)
                    .createdAt(LocalDateTime.now())
                    .build();

            ChatMessage saved = chatMessageRepository.save(entity);
            // 저장된 ID를 data에 추가해서 브로드캐스트에 포함
            data.put("dbId", saved.getId());
        } catch (Exception e) {
            // DB 저장 실패해도 WebSocket 브로드캐스트는 계속
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
