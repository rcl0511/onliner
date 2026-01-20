#!/usr/bin/env node
/**
 * Render API 테스트 스크립트
 * 사용법: node scripts/render-api-test.js
 */

const API_KEY = process.env.RENDER_API_KEY || 'rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv';
const BASE_URL = 'https://api.render.com/v1';

async function testRenderAPI() {
  try {
    console.log('🔍 Render API 연결 테스트 중...\n');
    
    const response = await fetch(`${BASE_URL}/services?limit=20`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ API 연결 성공!\n');
    console.log(`📊 총 서비스 수: ${data.length}\n`);
    
    if (data.length > 0) {
      console.log('📋 서비스 목록:');
      data.forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.service.name || '이름 없음'}`);
        console.log(`   ID: ${service.service.id}`);
        console.log(`   URL: ${service.service.serviceDetails?.url || 'N/A'}`);
        console.log(`   상태: ${service.service.serviceDetails?.healthCheckStatus || 'N/A'}`);
      });
    } else {
      console.log('⚠️  등록된 서비스가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ API 연결 실패:', error.message);
    process.exit(1);
  }
}

testRenderAPI();
