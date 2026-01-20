# Netlify 배포 가이드

## 빠른 시작

### 1. 환경 변수 준비

배포 전에 백엔드 서버 URL을 준비하세요.

### 2. Netlify 배포

#### 방법 A: GitHub 연동 (추천)

1. GitHub에 코드 푸시
2. [Netlify](https://www.netlify.com/) 로그인
3. "Add new site" → "Import an existing project"
4. GitHub 저장소 선택
5. 설정:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
6. "Environment variables" 클릭하여 추가:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.com
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```
7. "Deploy site" 클릭

#### 방법 B: 드래그 앤 드롭

1. 로컬에서 빌드:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Netlify 대시보드에서 `frontend/build` 폴더를 드래그 앤 드롭
3. 환경 변수는 Netlify 대시보드에서 설정

### 3. 환경 변수 설정

Netlify 대시보드 → Site settings → Environment variables:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `REACT_APP_API_BASE_URL` | 백엔드 서버 URL | `https://your-app.railway.app` |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API 키 | `AIzaSy...` |

⚠️ **중요**: 환경 변수 변경 후에는 재배포가 필요합니다.

### 4. 빌드 설정 확인

`netlify.toml` 파일이 이미 생성되어 있어 자동으로 설정됩니다:
- 빌드 명령: `npm run build`
- 배포 디렉토리: `build`
- SPA 라우팅 리다이렉트 설정

---

## 백엔드 서버 호스팅 옵션

### Railway (추천) ⭐

1. [Railway](https://railway.app/) 가입
2. "New Project" → "Deploy from GitHub repo"
3. `medicine-server` 디렉토리 선택
4. 자동 배포 완료
5. URL 확인 (예: `https://xxx.railway.app`)

### Render

1. [Render](https://render.com/) 가입
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. Root Directory: `medicine-server`
5. Build Command: `./gradlew build`
6. Start Command: `./gradlew bootRun`

---

## 체크리스트

### 배포 전
- [ ] 모든 하드코딩된 API URL이 환경 변수로 변경되었는지 확인
- [ ] 백엔드 서버가 배포되어 URL을 확인했는지 확인
- [ ] Google Maps API 키가 준비되었는지 확인

### 배포 후
- [ ] Netlify 사이트가 정상적으로 로드되는지 확인
- [ ] 로그인 기능이 작동하는지 확인
- [ ] API 호출이 성공하는지 확인 (브라우저 개발자 도구 Network 탭)
- [ ] CORS 오류가 없는지 확인

---

## 문제 해결

### API 호출 실패
- 환경 변수 `REACT_APP_API_BASE_URL`이 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 실제 요청 URL 확인
- 백엔드 서버가 실행 중인지 확인

### 빌드 실패
- `npm install`이 성공했는지 확인
- Node.js 버전 확인 (권장: 16 이상)
- Netlify 빌드 로그 확인

### 페이지가 404 에러
- `netlify.toml`의 리다이렉트 설정 확인
- React Router의 `BrowserRouter` 사용 확인

---

## 추가 리소스

- [전체 배포 가이드](../DEPLOYMENT_GUIDE.md)
- [Netlify 문서](https://docs.netlify.com/)
- [Railway 문서](https://docs.railway.app/)
