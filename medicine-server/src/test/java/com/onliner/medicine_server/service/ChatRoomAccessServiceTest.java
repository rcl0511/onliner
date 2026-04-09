package com.onliner.medicine_server.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChatRoomAccessServiceTest {

    private final ChatRoomAccessService service = new ChatRoomAccessService();

    @Test
    void hospitalCanAccessOwnRoomOnly() {
        Claims claims = Jwts.claims();
        claims.put("role", "hospital");
        claims.put("hospitalId", "hospital-snu");

        assertThat(service.canAccess("chat_messages_general_hospital_hospital-snu_vendor_dh-pharm", claims))
                .isTrue();
        assertThat(service.canAccess("chat_messages_general_hospital_hospital-seoul_vendor_dh-pharm", claims))
                .isFalse();
    }

    @Test
    void vendorCanAccessOwnRoomOnly() {
        Claims claims = Jwts.claims();
        claims.put("role", "vendor");
        claims.put("companyCode", "dh-pharm");

        assertThat(service.canAccess("chat_messages_general_hospital_hospital-snu_vendor_dh-pharm", claims))
                .isTrue();
        assertThat(service.canAccess("chat_messages_general_hospital_hospital-snu_vendor_other", claims))
                .isFalse();
    }
}
