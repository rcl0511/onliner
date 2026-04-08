# 배포 가이드 (Netlify + 백엔드 호스팅)

## 📋 목차
1. [프론트엔드 배포 (Netlify)](#1-프론트엔드-배포-netlify)
2. [백엔드 서버 호스팅](#2-백엔드-서버-호스팅)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [CORS 설정](#4-cors-설정)

---

## 1. 프론트엔드 배포 (Netlify)

### 1.1 Netlify 계정 생성 및 사이트 생성

1. [Netlify](https://www.netlify.com/)에 가입/로그인
2. "Add new site" → "Import an existing project" 선택
3. GitHub/GitLab/Bitbucket 저장소 연결 (또는 드래그 앤 드롭으로 배포)

### 1.2 빌드 설정

Netlify가 자동으로 감지하지만, 수동 설정 시:

- **Build command**: `npm run build`
- **Publish directory**: `build`
- **Base directory**: `frontend` (루트가 아닌 경우)

또는 `netlify.toml` 파일이 이미 생성되어 있으므로 자동으로 적용됩니다.

### 1.3 환경 변수 설정

Netlify 대시보드에서:
1. Site settings → Environment variables
2. 다음 변수 추가:

```
REACT_APP_API_BASE_URL=https://your-backend-url.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

⚠️ **중요**: 백엔드 서버를 먼저 배포한 후 URL을 설정해야 합니다.

---

## 2. 백엔드 서버 호스팅

Spring Boot 애플리케이션을 호스팅할 수 있는 옵션들:

### 옵션 1: Railway (추천) ⭐

**장점**: 무료 플랜 제공, 간단한 설정, 자동 배포

1. [Railway](https://railway.app/) 가입
2. "New Project" → "Deploy from GitHub repo" 선택
3. `medicine-server` 디렉토리 선택
4. 환경 변수 설정:
   - `SPRING_DATASOURCE_URL` (PostgreSQL 연결 문자열)
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
   - `PORT` (자동 설정됨)
5. 배포 완료 후 URL 확인 (예: `https://your-app.railway.app`)

**Railway 설정 파일** (`railway.json` - 선택사항):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "./gradlew bootRun",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 옵션 2: Render (추천) ⭐

**장점**: 무료 플랜, 쉬운 설정, Dockerfile 지원, API 제공

1. [Render](https://render.com/) 가입
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Root Directory**: `medicine-server`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `medicine-server/Dockerfile` (자동 감지)
5. 환경 변수 추가:
   - `PORT` (자동 설정됨)
   - `DATABASE_URL` (데이터베이스 사용 시)
6. Health Check 설정:
   - **Health Check Path**: `/healthz`
7. 배포 완료 후 URL 확인 (예: `https://your-app.onrender.com`)

**참고**: 
- Dockerfile이 이미 생성되어 있어 자동으로 사용됩니다
- `application-render-nodb.yml` 프로파일로 DB 없이 테스트 가능
- `/healthz` 엔드포인트로 헬스 체크 가능

#### Render API 사용하기

Render API를 사용하여 서비스를 관리할 수 있습니다:

**API 키 설정:**
```bash
export RENDER_API_KEY=rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv
```

**서비스 목록 조회:**
```bash
# Node.js 스크립트 사용
node scripts/render-service-info.js

# 또는 curl 직접 사용
curl --request GET \
     --url 'https://api.render.com/v1/services?limit=20' \
     --header 'Accept: application/json' \
     --header 'Authorization: Bearer rnd_ThFRQGbIgd5FsSYKmEdi8crCrlLv'
```

**특정 서비스 정보 조회:**
```bash
node scripts/render-service-info.js <service-id>
```

**API 테스트:**
```bash
node scripts/render-api-test.js
```

**참고**: API 키는 환경 변수로 관리하는 것을 권장합니다. `render-api-config.json` 파일은 참고용이며, 실제로는 환경 변수나 보안 저장소를 사용하세요.

### 옵션 3: Heroku

**장점**: 널리 사용됨, 많은 문서

1. [Heroku](https://www.heroku.com/) 가입
2. Heroku CLI 설치
3. 프로젝트 루트에서:
```bash
cd medicine-server
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### 옵션 4: AWS / Google Cloud / Azure

**장점**: 확장성, 성능

- AWS: Elastic Beanstalk 또는 EC2
- Google Cloud: Cloud Run 또는 App Engine
- Azure: App Service

---

## 3. 환경 변수 설정

### 프론트엔드 (Netlify)

Netlify 대시보드 → Site settings → Environment variables:

```
REACT_APP_API_BASE_URL=https://your-backend.railway.app
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCeAo-v9T_jpuvDn8kwpWtl8f0KOnnLXuc
```

### 백엔드 (Railway/Render 등)

백엔드 호스팅 플랫폼의 환경 변수 설정에서:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/database
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password
SPRING_PROFILES_ACTIVE=render
```

---

## 4. CORS 설정

백엔드 서버의 `WebConfig.java` 또는 `application.properties`에서:

```java
@CrossOrigin(origins = {
    "http://localhost:3000",
    "https://your-netlify-app.netlify.app"
})
```

또는 `application.properties`:
```properties
spring.web.cors.allowed-origins=http://localhost:3000,https://your-netlify-app.netlify.app
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,PATCH,OPTIONS
spring.web.cors.allowed-headers=*
```

---

## 5. 데이터베이스 설정

### Railway에서 데이터베이스 추가

1. Railway 프로젝트에서 "New" → "Database" → "PostgreSQL" 선택
2. 연결 정보 기준으로 `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`를 설정
3. Spring Boot가 자동으로 연결

### 수동 설정 (다른 플랫폼)

`application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://host:5432/database
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
```

---

## 6. 배포 체크리스트

### 프론트엔드
- [ ] `netlify.toml` 파일 확인
- [ ] 환경 변수 설정 (`REACT_APP_API_BASE_URL`)
- [ ] 빌드 성공 확인
- [ ] 배포 후 API 연결 테스트

### 백엔드
- [ ] 데이터베이스 연결 확인
- [ ] CORS 설정 확인
- [ ] 환경 변수 설정
- [ ] 포트 설정 (일부 플랫폼은 자동)
- [ ] 로그 확인

---

## 7. 트러블슈팅

### 프론트엔드에서 API 호출 실패
- 환경 변수가 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 실제 요청 URL 확인
- Netlify에서 환경 변수 재배포 필요할 수 있음

### 백엔드 연결 실패
- CORS 설정 확인
- 백엔드 URL이 올바른지 확인
- 백엔드 로그 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 형식 확인
- 방화벽/보안 그룹 설정 확인
- 데이터베이스가 실행 중인지 확인

---

## 8. 빠른 시작 (Railway + Netlify)

1. **백엔드 배포**:
   - Railway에 `medicine-server` 디렉토리 배포
   - 데이터베이스 추가
   - 배포 URL 확인 (예: `https://xxx.railway.app`)

2. **프론트엔드 배포**:
   - Netlify에 `frontend` 디렉토리 배포
   - 환경 변수 설정: `REACT_APP_API_BASE_URL=https://xxx.railway.app`
   - 재배포

3. **테스트**:
   - Netlify URL에서 로그인 테스트
   - API 호출 확인

---

## 참고 자료

- [Netlify 문서](https://docs.netlify.com/)
- [Railway 문서](https://docs.railway.app/)
- [Render 문서](https://render.com/docs)
- [Spring Boot 배포 가이드](https://spring.io/guides/gs/spring-boot-for-azure/)
