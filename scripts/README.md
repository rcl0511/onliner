# Render API 스크립트

Render API를 사용하여 서비스를 관리하는 스크립트들입니다.

## 설정

### 환경 변수 설정 (권장)

```bash
# Windows (PowerShell)
$env:RENDER_API_KEY="rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv"

# Windows (CMD)
set RENDER_API_KEY=rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv

# Linux/Mac
export RENDER_API_KEY=rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv
```

또는 `.env` 파일 생성:
```
RENDER_API_KEY=rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv
```

## 사용법

### 1. API 연결 테스트

```bash
node scripts/render-api-test.js
```

서비스 목록을 조회하고 연결 상태를 확인합니다.

### 2. 서비스 목록 조회

```bash
node scripts/render-service-info.js
```

모든 서비스의 기본 정보를 출력합니다.

### 3. 특정 서비스 상세 정보

```bash
node scripts/render-service-info.js <service-id>
```

특정 서비스의 상세 정보를 JSON 형식으로 출력합니다.

### 4. Shell 스크립트 사용 (Linux/Mac)

```bash
chmod +x scripts/render-deploy.sh
./scripts/render-deploy.sh
```

## API 엔드포인트 예시

### 서비스 목록 조회
```bash
curl --request GET \
     --url 'https://api.render.com/v1/services?limit=20' \
     --header 'Accept: application/json' \
     --header 'Authorization: Bearer rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv'
```

### 서비스 상세 정보
```bash
curl --request GET \
     --url 'https://api.render.com/v1/services/<service-id>' \
     --header 'Accept: application/json' \
     --header 'Authorization: Bearer rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv'
```

## 참고

- API 키는 보안상 환경 변수로 관리하는 것을 권장합니다
- `render-api-config.json` 파일은 `.gitignore`에 포함되어 있습니다
- Render API 문서: https://api.render.com/
