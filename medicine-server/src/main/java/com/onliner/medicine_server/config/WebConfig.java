package com.onliner.medicine_server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed.origins:http://localhost:3000,https://onlinerr.netlify.app}")
    private String allowedOrigins;

    // 🔹 CORS 설정: React 프론트엔드와 연동 가능하도록 허용
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // 환경 변수에서 허용할 오리진을 읽거나, 기본값 사용
        String[] origins = allowedOrigins.split(",");
        
        // 와일드카드 패턴을 지원하는 allowedOriginPatterns 사용
        // Netlify의 경우 모든 서브도메인을 허용하기 위해 패턴 사용
        String[] originPatterns = new String[origins.length + 1];
        System.arraycopy(origins, 0, originPatterns, 0, origins.length);
        originPatterns[origins.length] = "https://*.netlify.app";  // 모든 Netlify 서브도메인
        
        registry.addMapping("/**")
                .allowedOriginPatterns(originPatterns)  // Netlify 와일드카드 패턴 지원
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
