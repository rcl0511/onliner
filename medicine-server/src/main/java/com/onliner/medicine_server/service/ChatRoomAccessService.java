package com.onliner.medicine_server.service;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;

@Service
public class ChatRoomAccessService {

    public boolean canAccess(String roomId, Claims claims) {
        if (roomId == null || roomId.isBlank() || claims == null) {
            return false;
        }

        String role = claims.get("role", String.class);
        String hospitalId = claims.get("hospitalId", String.class);
        String companyCode = claims.get("companyCode", String.class);

        if ("hospital".equalsIgnoreCase(role)) {
            return hospitalId != null && roomId.contains("hospital_" + hospitalId);
        }
        if ("vendor".equalsIgnoreCase(role)) {
            return companyCode != null && roomId.contains("vendor_" + companyCode);
        }
        return false;
    }
}
