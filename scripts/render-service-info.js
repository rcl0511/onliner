#!/usr/bin/env node
/**
 * Render 서비스 정보 조회 스크립트
 * 사용법: 
 *   node scripts/render-service-info.js
 *   node scripts/render-service-info.js <service-id>
 */

const API_KEY = process.env.RENDER_API_KEY || 'rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv';
const BASE_URL = 'https://api.render.com/v1';

async function getServices() {
  try {
    const response = await fetch(`${BASE_URL}/services?limit=20`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('서비스 목록 조회 실패:', error.message);
    throw error;
  }
}

async function getServiceDetails(serviceId) {
  try {
    const response = await fetch(`${BASE_URL}/services/${serviceId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('서비스 상세 조회 실패:', error.message);
    throw error;
  }
}

async function main() {
  const serviceId = process.argv[2];

  if (serviceId) {
    // 특정 서비스 상세 정보
    console.log(`🔍 서비스 상세 정보 조회 중... (ID: ${serviceId})\n`);
    const service = await getServiceDetails(serviceId);
    console.log(JSON.stringify(service, null, 2));
  } else {
    // 모든 서비스 목록
    console.log('📋 서비스 목록 조회 중...\n');
    const services = await getServices();
    
    if (services.length === 0) {
      console.log('⚠️  등록된 서비스가 없습니다.');
      return;
    }

    console.log(`총 ${services.length}개의 서비스:\n`);
    services.forEach((item, index) => {
      const svc = item.service;
      console.log(`${index + 1}. ${svc.name || '이름 없음'}`);
      console.log(`   ID: ${svc.id}`);
      console.log(`   타입: ${svc.type || 'N/A'}`);
      if (svc.serviceDetails?.url) {
        console.log(`   URL: ${svc.serviceDetails.url}`);
      }
      console.log('');
    });
  }
}

main().catch(console.error);
