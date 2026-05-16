# UI/UX 연결용 API 기능명세서

기준 서버: `http://localhost:4000`

인증 방식: 로그인 응답의 `access_token`을 이후 요청 헤더에 넣습니다.

```http
Authorization: Bearer {access_token}
```

## 개발/데모 로그인 계정

UI에 회원가입 화면이 없어도 아래 `code`로 로그인할 수 있습니다.

| 용도 | 로그인 code | 닉네임 | 비고 |
| --- | --- | --- | --- |
| UI 구현용 대표 계정 | `dev-login` | 개발로그인 | 기본 개발 로그인 계정 |
| 데모 계정 1 | `demo-user-01` | 데모유저1 | 테스트/리뷰 작성용 |
| 데모 계정 2 | `demo-user-02` | 데모유저2 | 테스트/리뷰 작성용 |
| 데모 계정 3 | `demo-user-03` | 데모유저3 | 테스트/리뷰 작성용 |
| 데모 계정 4 | `demo-user-04` | 데모유저4 | 테스트/리뷰 작성용 |
| 데모 계정 5 | `demo-user-05` | 데모유저5 | 테스트/리뷰 작성용 |

로그인 요청:

```json
{
  "code": "dev-login"
}
```

## 인증/마이페이지

| 기능 | Method | Path | Auth | 요청 Body/Query | 성공 응답 핵심 | UI 연결 메모 |
| --- | --- | --- | --- | --- | --- | --- |
| 로그인 | POST | `/auth/gachon/login` | 없음 | `{ "code": "dev-login" }` | `access_token`, `refresh_token`, `user` | 현재 UI는 회원가입 대신 이 API 사용 |
| 회원가입 | POST | `/auth/signup` | 없음 | `code`, `nickname`, `email?`, `preferred_categories?` | `access_token`, `refresh_token`, `user` | UI에 회원가입 화면 생기면 연결 |
| 토큰 갱신 | POST | `/auth/refresh` | 없음 | `{ "refresh_token": "..." }` | 새 `access_token`, `refresh_token` | 401 대응용 |
| 로그아웃 | POST | `/auth/logout` | 필요 | `{ "refresh_token": "..." }` | `{ "ok": true }` | 로컬 토큰 삭제와 같이 처리 |
| 내 정보 | GET | `/users/me` | 필요 | 없음 | 프로필, `kg`, 작성/클립/추천 수 | 마이페이지 첫 화면 |
| 내 정보 수정 | PATCH | `/users/me` | 필요 | `nickname?`, `email?`, `preferred_categories?` | `updated_user` | 프로필 수정 |

## 게시글/리뷰

| 기능 | Method | Path | Auth | 요청 Body/Query | 성공 응답 핵심 | UI 연결 메모 |
| --- | --- | --- | --- | --- | --- | --- |
| 카테고리 목록 | GET | `/categories` | 없음 | 없음 | `categories[]` | 필터/글쓰기 카테고리 |
| 게시글 목록 | GET | `/posts` | 없음 | `q?`, `category?`, `page?`, `limit?`, `sort?` | `posts[]`, `paging` | `sort`: `popular`, `rating` 또는 기본 최신순 |
| 게시글 작성 | POST | `/posts` | 필요 | `restaurant_id`, `category_id`, `title`, `content`, `photos[]` | `postId` | 로그인 사용자 글 작성 |
| 게시글 상세 | GET | `/posts/:postId` | 없음 | 없음 | `post`, `author`, `avg_rating`, `like_count`, `photos` | 상세 화면 |
| 게시글 수정 | PATCH | `/posts/:postId` | 필요 | `title?`, `content?`, `photos?` | `post` | 작성자 본인만 가능 |
| 게시글 삭제 | DELETE | `/posts/:postId` | 필요 | 없음 | `{ "ok": true }` | 작성자 본인만 가능 |
| 좋아요 | POST | `/posts/:postId/like` | 필요 | 없음 | `ok`, `likeCount` | 본인 글 좋아요 불가 |
| 스크랩 | POST | `/posts/:postId/scrap` | 필요 | 없음 | `{ "ok": true }` | 본인 글 스크랩 불가 |
| 리뷰 목록 | GET | `/posts/:postId/reviews` | 없음 | 없음 | `reviews[]` | 상세 화면 리뷰 탭 |
| 리뷰 작성 | POST | `/posts/:postId/reviews` | 필요 | `rating`, `content`, `photos[]` | `reviewId`, `review` | 본인 글 리뷰 불가. 다른 계정 토큰 필요 |
| 내 작성 글 | GET | `/users/posts` | 필요 | `user_id?` | `posts[]` | 관리자만 다른 `user_id` 조회 가능 |
| 내 클립 | GET | `/users/clip` | 필요 | `user_id?` | `clips[]` | 저장/스크랩 화면 |

게시글 작성 예시:

```json
{
  "restaurant_id": "rest_001",
  "category_id": "western",
  "title": "가천대 근처 맛집",
  "content": "API로 작성한 게시글입니다.",
  "photos": ["https://picsum.photos/seed/post/640/480"]
}
```

리뷰 작성 예시:

```json
{
  "rating": 5,
  "content": "다른 사용자가 남긴 리뷰입니다.",
  "photos": []
}
```

## 랭킹

| 기능 | Method | Path | Auth | 요청 Body/Query | 성공 응답 핵심 | UI 연결 메모 |
| --- | --- | --- | --- | --- | --- | --- |
| 사용자 랭킹 | GET | `/rankings/users` | 없음 | 없음 | `rankings[]` | 전체 랭킹 화면 |
| 카테고리 랭킹 | GET | `/rankings/categories/:categoryId` | 없음 | `categoryId` path | `rankings[]` | 카테고리별 랭킹 |
| 칭호 목록 | GET | `/rankings/titles` | 없음 | 없음 | `titles[]` | 마이페이지/칭호 안내 |

## AI

| 기능 | Method | Path | Auth | 요청 Body/Query | 성공 응답 핵심 | UI 연결 메모 |
| --- | --- | --- | --- | --- | --- | --- |
| AI 추천 | POST | `/ai/recommendations` | 필요 | `intent?`, `budget?`, `filters?`, `location?`, `time?`, `people?` | `candidates[]`, `meta.recommendation_id` | 추천 결과 화면 |
| 추천 설명 | POST | `/ai/recommendations/explain` | 필요 | `{ "recommendation_id": "..." }` | `explanation`, `confidence`, `source` | 추천 상세 설명 |
| AI 채팅 | POST | `/ai/chat` | 필요 | `{ "messages": [{ "role": "user", "content": "..." }] }` | `reply`, `actions`, `session_id` | 챗봇 화면 |
| 내용 요약 | POST | `/ai/content/summarize` | 필요 | `text`, `limit?` | `summary`, `model_name` | 리뷰/글 요약 보조 |
| 태그 추출 | POST | `/ai/content/tags` | 필요 | `text` | `tags[]` | 글 작성 보조 |
| 카테고리 분류 | POST | `/ai/content/category` | 필요 | `text` | `category_id`, `confidence` | 글 작성 카테고리 추천 |

## 상태/개발용

| 기능 | Method | Path | Auth | 요청 Body/Query | 성공 응답 핵심 | UI 연결 메모 |
| --- | --- | --- | --- | --- | --- | --- |
| 서버 상태 | GET | `/health` | 없음 | 없음 | `ok`, `service`, `timestamp` | 헬스체크 |
| DB 상태 | GET | `/db/health` | 없음 | 없음 | `ok`, `timestamp` | 개발 확인용 |
| 초기 데이터 | GET | `/seed` | 없음 | 없음 | 카테고리/게시글/랭킹/추천 | 프론트 목업 데이터 확인 |
| 테스트 계정/글 시드 | POST | `/admin/seed/test-accounts` | 관리자 필요 | 없음 | 생성 수, 좋아요/리뷰 수 | 관리자 토큰 필요 |
| DB 테스트 유저 생성 | POST | `/db/test/users` | 없음 | `nickname?`, `preferred_categories?` | `user` | 개발 확인용 |
| DB 테스트 유저 조회 | GET | `/db/test/users/:userId` | 없음 | `userId` path | `user` | 개발 확인용 |

## 프론트 연결 시 주의사항

| 항목 | 내용 |
| --- | --- |
| 회원가입 UI 없음 | 현재는 `dev-login` 또는 `demo-user-*` 코드로 로그인하면 됩니다. |
| 리뷰 작성 | 본인 글에는 리뷰를 남길 수 없습니다. 작성자와 리뷰어 계정을 분리해야 합니다. |
| 인증 실패 | `401`이면 `refresh_token`으로 `/auth/refresh`를 호출한 뒤 재시도합니다. |
| 카테고리 id | 메모리/API에서는 `western`, `chinese`, `japanese`, `pub` slug를 사용합니다. |
| Postman | 작성자/리뷰어 토큰을 분리해둔 컬렉션이 `postman/`에 있습니다. |
