package com.onliner.medicine_server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 🔹 CORS 설정: React 프론트엔드와 연동 가능하도록 허용
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")  // React 개발 서버 주소
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    // 🔹 정적 리소스 핸들링: /uploads/** 와 /exports/** 경로 파일 제공
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // ① 업로드 폴더 매핑 (예: 파일 업로드 등)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:///C:/Users/USER/Desktop/react/onliner/medicine-server/uploads/");

        // ② PDF 내보내기 폴더 매핑 (프론트에서 다운로드용 링크로 사용)
       registry.addResourceHandler("/exports/**")
        .addResourceLocations("file:///C:/Users/USER/Desktop/react/onliner/medicine-server/exports/");
    }
}
