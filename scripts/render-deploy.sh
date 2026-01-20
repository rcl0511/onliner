#!/bin/bash
# Render 배포 스크립트
# 사용법: ./scripts/render-deploy.sh

set -e

API_KEY="${RENDER_API_KEY:-rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv}"
BASE_URL="https://api.render.com/v1"

echo "🚀 Render 배포 스크립트"
echo "========================"
echo ""

# 1. API 키 테스트
echo "1️⃣  API 키 확인 중..."
response=$(curl -s -w "\n%{http_code}" \
  --request GET \
  --url "${BASE_URL}/services?limit=1" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer ${API_KEY}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" != "200" ]; then
  echo "❌ API 키 인증 실패 (HTTP $http_code)"
  exit 1
fi

echo "✅ API 키 인증 성공"
echo ""

# 2. 서비스 목록 조회
echo "2️⃣  서비스 목록 조회 중..."
curl -s \
  --request GET \
  --url "${BASE_URL}/services?limit=20" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer ${API_KEY}" \
  | jq '.[] | {name: .service.name, id: .service.id, url: .service.serviceDetails.url}'

echo ""
echo "✅ 완료!"
