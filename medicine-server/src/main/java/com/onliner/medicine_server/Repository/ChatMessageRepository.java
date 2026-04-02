package com.onliner.medicine_server.Repository;

import com.onliner.medicine_server.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop100ByRoomIdOrderByCreatedAtAsc(String roomId);
}
