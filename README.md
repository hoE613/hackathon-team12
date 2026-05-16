# JjepjepSecretary

로컬에서 바로 실행 가능한 맛집 추천 커뮤니티 + 쩝쩝비서 AI 프로젝트 스캐폴드입니다.

## 구조

- `apps/backend`: Node.js API 서버
- `frontend`: React + Vite 클라이언트

## 실행

현재 환경처럼 시스템 `node`가 오래된 경우, 먼저 로컬 Node 22를 PATH 앞에 올려주세요.

```bash
export PATH=/home/byeonghunlee/.local/nodejs/current/bin:$PATH
```

1. 의존성 설치

```bash
npm install
```

2. 프론트 + 백엔드 동시 실행

```bash
npm run dev
```

개발 모드에서는 아래 주소로 접속합니다.

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:4000`

3. 개별 실행

```bash
npm run dev:backend
npm run dev:frontend
```

4. 한 주소에서 데모 실행

백엔드 `http://localhost:4000` 하나로 웹사이트를 열려면 먼저 프론트 빌드가 필요합니다.
`frontend/dist`는 `.gitignore`로 커밋되지 않으므로, 새 노트북에서 클론한 뒤 아래 명령을 실행하세요.

```bash
cp apps/backend/.env.example apps/backend/.env
npm run db:start
npm run start
```

`npm run start`는 `frontend/dist`와 `apps/backend/dist`를 새로 빌드한 뒤 백엔드를 실행합니다.
빌드 없이 `npm run dev:backend`만 실행하고 `http://localhost:4000/posts`를 열면 프론트 파일이 없어 404가 날 수 있습니다.

## 기본 포트

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## 참고

- 현재 구조는 `kg_score` 기준으로 통일되어 있습니다.
- 실제 DB, 로그인, Gemini 연동은 이후 API 명세에 맞춰 확장하면 됩니다.
- 프론트: `frontend/.env.example`
- 백엔드: `apps/backend/.env.example`
