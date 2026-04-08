# Onliner

의약품 도매업체와 병원 간 주문, 명세서, 배송, 정산 흐름을 관리하는 웹 서비스입니다.

기획 배경과 서비스 의도는 [기획.md](https://github.com/rcl0511/onliner/blob/main/%EA%B8%B0%ED%9A%8D.md)에서 확인할 수 있습니다.

## 현재 구현 범위

### 포털

- `vendor` 포털: 대시보드, 주문 관리, 재고 관리, 배송 관리, 명세서 관리, 거래처 관리, 거래장, 설정
- `hospital` 포털: 로그인, 주문, 받은 명세서 확인, 결제, 로그, 마이페이지

### 백엔드 기능

- JWT 기반 로그인 및 권한 보호
- Spring Security 기반 API 접근 제어
- 주문 등록 및 상태 변경
- 명세서 업로드, 다건 업로드, 명세서 레코드 조회/상태 변경
- 서명 저장/조회
- 거래처 관리 및 엑셀 업로드
- 의약품 목록 조회, 수정, 업로드
- 거래장 업로드/조회
- 배송 기사 조회, PDF 배정, 배송 할당
- 대시보드 집계 API
- WebSocket 채팅 메시지 조회/실시간 송수신
- Toss 결제 확인 API
- 업체 설정 조회/수정

### 저장/배포 관련

- 로컬 개발 DB: PostgreSQL
- 배포 DB: PostgreSQL(Render 프로필)
- 파일 스토리지: 로컬 업로드 디렉터리 + Supabase Storage(Render 프로필)
- 프론트 배포: Netlify 기준
- 백엔드 배포: Render 기준



## 기술 스택

### Frontend

| 기술 스택 | 선택 이유 | 다른 선택지보다 적합했던 이유 |
| --- | --- | --- |
| `React` | 컴포넌트 기반 UI 관리 | 병원 포털과 벤더 포털처럼 화면 수와 상태가 많은 구조에서 템플릿 중심 방식보다 재사용성과 상태 분리가 쉬움 |
| `React Router DOM` | 역할별 라우팅 분리 | 로그인 이후 `vendor`와 `hospital` 영역을 보호 라우트로 분리하기 쉬워 단순 정적 라우팅보다 접근 제어 흐름 표현에 유리함 |
| `Axios` + `fetch` | HTTP 통신 유연성 | 공통 API 호출과 간단한 요청을 상황에 따라 혼용할 수 있어 과도한 추상화 없이 빠르게 연동 가능함 |
| `date-fns` | 경량 날짜 처리 | 명세서 날짜, 기간 필터, 최근 내역 계산에 필요한 함수만 가져다 쓸 수 있어 무거운 날짜 라이브러리보다 부담이 적음 |
| `Create React App` | 초기 설정 비용 절감 | 현재 프로젝트 규모에서는 번들러 세팅보다 기능 구현 속도가 중요해 직접 빌드 환경을 구성하는 방식보다 개발 진입이 빠름 |

### Backend

| 기술 스택 | 선택 이유 | 다른 선택지보다 적합했던 이유 |
| --- | --- | --- |
| `Spring Boot` | 도메인별 API 구조화 | 주문, 명세서, 결제, 거래처, 설정 기능을 컨트롤러/서비스/리포지토리 구조로 분리하기 쉬워 경량 서버 구조보다 유지보수에 유리함 |
| `Spring Boot`로의 마이그레이션 | 백엔드 표준화, 보안 체계화, 데이터 계층 안정화 | 현재 저장소 기준으로 인증, 권한, JPA, 파일 처리, 배포 프로필을 한 프레임워크 안에서 일관되게 묶을 수 있어 기능이 늘어난 시점의 단순 서버 구조보다 운영 안정성 확보에 유리함 |
| `Spring Data JPA` | 엔티티 중심 데이터 접근 | 주문, 명세서, 사용자, 거래처처럼 관계형 데이터가 많은 구조에서 직접 SQL 위주 방식보다 생산성과 일관성이 높음 |
| `Spring Security` | 인증/인가 일원화 | 병원과 벤더 권한을 API 단에서 강제할 수 있어 개별 미들웨어 분산 처리보다 정책 관리가 명확함 |
| `JWT` | 무상태 인증 처리 | 프론트와 백엔드가 분리된 구조에서 세션 저장소 없이 인증 상태를 전달하기 쉬워 서버 세션 방식보다 배포 구조에 맞음 |
| `WebSocket` | 실시간 채팅 이벤트 처리 | 현재 구현은 `/ws/chat`에서 JWT 인증 후 채팅방 `subscribe`, `unsubscribe`, 메시지 `broadcast`, `read` 이벤트 전파에 사용되어 폴링보다 반응성과 네트워크 효율이 좋음 |
| `Apache POI` | 엑셀 업로드 처리 | 거래처, 재고, 거래장 업로드처럼 실무에서 엑셀 입력이 많은 요구를 별도 변환 서버 없이 바로 처리할 수 있음 |
| `Apache PDFBox` | PDF 파싱/병합/양식 출력 | 명세서 업로드와 양식 기반 출력이 핵심이라 단순 파일 저장 라이브러리보다 PDF 직접 처리 기능이 중요함 |
| `Java Mail Sender` | 메일 확장 기반 확보 | 계정 발급, 알림, 운영 메일 기능을 같은 백엔드 안에서 확장하기 쉬워 외부 메일 처리 로직 분산보다 관리가 단순함 |

### 인프라

| 기술 스택 | 선택 이유 | 다른 선택지보다 적합했던 이유 |
| --- | --- | --- |
| `PostgreSQL` | 로컬/배포 공통 관계형 DB | 로컬과 배포 환경을 같은 엔진으로 맞춰 SQL, 타입, 제약조건 차이로 인한 불일치 위험을 줄이기 좋음 |
| `Supabase Storage` | 파일 자산 저장 | 명세서 PDF와 서명 이미지처럼 객체 스토리지가 필요한 자산을 애플리케이션 서버 디스크보다 안정적으로 다루기 쉬움 |
| `Netlify` | 프론트 정적 배포 | React 빌드 산출물을 빠르게 배포하고 프리뷰 URL을 만들기 쉬워 프론트 운영에 적합함 |
| `Render` | Spring Boot 배포 단순화 | Dockerfile 기반으로 백엔드 앱을 바로 올릴 수 있어 별도 인프라 구성 부담이 적음 |

## 디렉터리 구조

```text
.
├── frontend/          # React 앱
├── medicine-server/   # Spring Boot API 서버
├── scripts/           # 보조 스크립트/문서
├── DEPLOYMENT_GUIDE.md
└── README.md
```




## 유저 플로우

### 병원 사용자 플로우

```text
[병원 로그인]
    ↓
[주문 작성]
도매업체 선택 → 약품/수량 입력 → 주문 전송
    ↓
[명세서 수신 확인]
발행된 명세서 목록 확인
    ↓
[명세서 상세 확인]
상태 확인 → 수정본 확인 → 서명 확인
    ↓
[이력/계정 확인]
/hospital/logs → 주문/처리 이력 확인
/hospital/mypage → 계정 정보 확인
```

### 도매업체 사용자 플로우

```text
[도매업체 로그인]
업체 코드 + 계정 입력
    ↓
[운영 현황 확인]
매출 / 배송 / 재고 부족 / 최근 주문 확인
    ↓
[주문 처리]
병원 주문 조회 → 상태 변경
    ↓
[명세서 작성]
직접 작성 또는 PDF 업로드
    ↓
[배송 배정]
기사 배정 → 배송 상태 관리
    ↓
[운영 데이터 관리]
재고 관리, 거래처 관리, 거래장 관리
    ↓
[설정/권한 관리]
```






### 백엔드

로컬 `application.properties` 기준 주요 값:

- `JWT_SECRET`
- `TOSS_SECRET_KEY`
- `UPLOAD_DIR`
- `EXPORT_DIR`
- `TEMPLATE_DIR`

Render 프로필에서 추가로 사용하는 값:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`



Docker 이미지 빌드는 [medicine-server/Dockerfile](/Users/lynn/Desktop/dev/onliner/medicine-server/Dockerfile)를 사용합니다.

## 참고 문서

- 서비스 기획 문서: [기획.md](/Users/lynn/Desktop/dev/onliner/기획.md)
- 배포 상세 가이드: [DEPLOYMENT_GUIDE.md](/Users/lynn/Desktop/dev/onliner/DEPLOYMENT_GUIDE.md)
- 프론트 배포 메모: [frontend/README_DEPLOY.md](/Users/lynn/Desktop/dev/onliner/frontend/README_DEPLOY.md)
