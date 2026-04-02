package com.onliner.medicine_server.controller;

import com.onliner.medicine_server.Repository.ChatMessageRepository;
import com.onliner.medicine_server.entity.ChatMessage;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Profile("!render-nodb")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;

    public ChatController(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(@PathVariable String roomId) {
        List<ChatMessage> messages = chatMessageRepository.findTop100ByRoomIdOrderByCreatedAtAsc(roomId);
        List<Map<String, Object>> result = messages.stream().map(m -> Map.<String, Object>of(
                "id", m.getId(),
                "roomId", m.getRoomId(),
                "sender", m.getSenderId(),
                "senderName", m.getSenderName(),
                "message", m.getMessage(),
                "messageType", m.getMessageType(),
                "timestamp", m.getCreatedAt().toString()
        )).toList();
        return ResponseEntity.ok(result);
    }
}
