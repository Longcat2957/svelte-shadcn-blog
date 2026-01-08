# svelte-shadcn-blog

오픈소스 기반으로 만든 **SvelteKit 블로그 서비스**입니다.

Svelte 5(Runes) + TailwindCSS + shadcn-svelte(bits-ui) 기반 UI, Drizzle ORM(PostgreSQL) 기반 데이터 계층, JWT 쿠키 인증 기반의 **관리자(Admin) CMS**를 포함합니다.

> 이 저장소는 개인/팀 블로그를 빠르게 띄우고 커스터마이징하기 좋은 베이스 프로젝트를 목표로 합니다.

---

## 주요 기능

- **블로그 글(Posts)**
    - 마크다운 기반 콘텐츠
    - 발행/비공개(published) 관리
    - 조회수(views) 증가 API
    - 목록/검색(q)/태그(tag)/카테고리(categoryId) 필터링
- **카테고리(Categories)**
    - 계층형 트리 구조(parent/children)
    - 관리자에서 정렬(reorder) 및 이동(move)
- **태그(Tags)**
    - Postgres `text[]` 컬럼으로 관리 (별도 조인 테이블 없이)
    - 태그 목록 API 제공
- **댓글(Comments)**
    - 글 단위 댓글 작성/조회
    - 대댓글(parent_id)
    - 비밀댓글(is_secret) + 비밀번호
    - 관리자는 비밀댓글 원문 조회 가능
- **관리자(Admin) 영역**
    - `/admin/login` 로그인
    - `/admin` 대시보드
    - 글 작성/편집, 카테고리 관리, 사용자(관리자) 관리
- **이미지 업로드(Cloudflare Images)**
    - 관리자에서 이미지 업로드 API 제공
    - Cloudflare Images로 업로드 후 URL 반환
    - `/admin/write` 에서 **클립보드 붙여넣기(Ctrl+V)** 뿐 아니라 **파일 선택 업로드**도 지원

---

## 기술 스택

- **Framework**: SvelteKit
- **UI**: shadcn-svelte(bits-ui), TailwindCSS
- **DB**: PostgreSQL
- **ORM/Migrations**: Drizzle ORM / drizzle-kit
- **Auth**: JWT (cookie 기반)
- **Image**: Cloudflare Images

---

## 시작하기 (로컬 실행)

### 1) 설치

```bash
pnpm install
```

### 2) 환경변수 설정

`.env.example`을 복사해 `.env`를 만들고 값을 채워주세요.

```bash
cp .env.example .env
```

필수 환경변수:

| 키              | 설명                                          |
| --------------- | --------------------------------------------- |
| `DATABASE_URL`  | PostgreSQL 연결 문자열                        |
| `JWT_SECRET`    | 관리자 로그인 JWT 서명용 시크릿               |
| `CF_API_TOKEN`  | Cloudflare API Token (Images: Edit 권한 필요) |
| `CF_ACCOUNT_ID` | Cloudflare Account ID                         |

참고:

- 현재 코드 기준으로 `JWT_REFRESH_SECRET`, `CF_ACCOUNT_HASH`는 사용하지 않습니다. (추후 확장 여지)
- `JWT_SECRET` 생성 예시:

```bash
openssl rand -hex 64
```

### 3) DB 스키마 적용

이 프로젝트는 Drizzle을 사용합니다.

- 빠르게 현재 스키마를 DB에 반영하려면:

```bash
pnpm db:push
```

- SQL 마이그레이션 파일(`drizzle/*.sql`) 기반으로 적용하려면:

```bash
pnpm db:migrate
```

### 4) 관리자 계정 생성

관리자 로그인에 사용할 `user` 레코드를 생성합니다.

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=pass pnpm -s register:admin
```

동일한 username이 이미 존재하면 생성하지 않고 종료합니다.

### 5) 개발 서버 실행

```bash
pnpm dev
```

---

## 경로 안내

- 사용자 영역
    - `/` : 홈
    - `/blog/[id]` : 글 상세
    - `/about` : 소개 페이지

- 관리자 영역
    - `/admin/login` : 로그인
    - `/admin` : 대시보드
    - `/admin/write` : 글 작성
    - `/admin/categories` : 카테고리 관리
    - `/admin/user` : 사용자(관리자) 관리

---

## API 요약

> 상세 스펙은 `src/routes/api/**`를 참고하세요.

### Public API

- `GET /api/posts`
    - query: `limit`, `cursor`, `categoryId`, `tag`, `q`
- `GET /api/posts/[id]`
- `POST /api/posts/[id]/view` (조회수 증가)
- `GET /api/categories`
- `GET /api/categories/[id]/posts`
- `GET /api/tags`
- `GET /api/posts/[id]/comments`
- `POST /api/posts/[id]/comments` (same-origin 제약)

### Admin API (로그인 필요)

- `POST /api/admin/posts` / `PATCH /api/admin/posts/[id]`
- `POST /api/admin/posts/[id]/publish` / `POST /api/admin/posts/[id]/unpublish`
- `POST /api/admin/images/upload` (Cloudflare Images 업로드)
- `GET/POST /api/admin/categories` 및 하위 라우트(reorder/move 등)
- `POST /api/admin/user`

---

## 스크립트

| 명령                  | 설명                      |
| --------------------- | ------------------------- |
| `pnpm dev`            | 개발 서버 실행            |
| `pnpm build`          | 프로덕션 빌드             |
| `pnpm preview`        | 빌드 결과 미리보기        |
| `pnpm check`          | svelte-check              |
| `pnpm lint`           | eslint + prettier 체크    |
| `pnpm format`         | prettier 포맷             |
| `pnpm register:admin` | 관리자 계정 생성 스크립트 |
| `pnpm db:push`        | 스키마를 DB에 푸시        |
| `pnpm db:migrate`     | 마이그레이션 적용         |
| `pnpm db:generate`    | 마이그레이션 생성         |
| `pnpm db:studio`      | Drizzle Studio            |
| `pnpm db:drop`        | DB 초기화(주의)           |

---

## 프로젝트 구조 (요약)

- `src/routes/(app)` : 사용자(블로그) 영역 라우트
- `src/routes/(admin)` : 관리자 CMS 라우트
- `src/routes/api` : API 라우트
- `src/lib/server/db` : Drizzle 설정/스키마
- `src/lib/server/auth` : JWT/패스워드 해시
- `src/lib/server/cloudflare-images.ts` : Cloudflare Images 업로드
- `drizzle/` : 마이그레이션 SQL

---

## 기여(Contributing)

PR과 이슈 환영합니다.

- TypeScript에서 `any` 사용은 지양해주세요.
- UI는 가능하면 `shadcn-svelte` 컴포넌트/패턴을 우선 사용해주세요.
- 서버 환경변수(`.env`) 의존 로직을 추가할 경우, **`.env.example` 업데이트**도 함께 해주세요.

---

## 라이선스

이 프로젝트는 오픈소스입니다.

- 저장소에 `LICENSE` 파일이 포함되어 있다면 해당 라이선스를 따릅니다.
- 아직 `LICENSE` 파일이 없다면, 배포/사용 전 라이선스를 먼저 명시해주세요.
