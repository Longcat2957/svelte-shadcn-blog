# svelte-shadcn-blog

**Svelte 5(Runes)** 기반 오픈소스 개인 블로그입니다.

> 샘플 페이지: [https://blog.tensorcube.net](https://blog.tensorcube.net)

## 기술 스택

| 분류      | 기술                                     | 선택 이유                                                           |
| --------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Framework | SvelteKit + Svelte 5 Runes               | 반응형 상태관리를 Rune(`$state`, `$derived`) 문법으로 일관되게 처리 |
| UI        | shadcn-svelte (bits-ui) + TailwindCSS v4 | 디자인 시스템 일관성 유지, 커스터마이징 용이                        |
| DB        | PostgreSQL + Drizzle ORM                 | 타입 안전한 쿼리, 마이그레이션 관리                                 |
| Auth      | JWT (HTTP-only cookie)                   | 경량 인증, 별도 세션 DB 불필요                                      |
| Markdown  | svelte-exmarkdown + Shiki + KaTeX        | 코드 하이라이팅, 수식 렌더링                                        |
| Image     | Cloudflare Images                        | 이미지 최적화 및 CDN 배포 자동화                                    |
| AI        | OpenAI API + fal.ai                      | 글 작성 보조, 이미지 생성                                           |

## 주요 기능

### 블로그
- **포스트 관리**: 마크다운 기반 글 작성, 수정, 발행/비발행
- **카테고리**: 계층형 카테고리 구조 지원
- **태그**: 배열 기반 태그 시스템 (GIN Index로 검색 최적화)
- **댓글**: 비밀댓글, 대댓글 지원
- **조회수 통계**: 일별 조회수, 유입경로 집계

### 관리자
- **대시보드**: 포스트/조회수 통계 시각화 (LayerChart)
- **글쓰기**: 실시간 프리뷰, AI 글쓰기 보조
- **카테고리 관리**: 드래그 앤 드롭 정렬
- **이미지 업로드**: Cloudflare Images 연동

### AI 기능
- **텍스트 생성**: OpenAI API 기반 글쓰기 보조
- **이미지 생성**: fal.ai 기반 텍스트→이미지, 이미지→이미지

## 시작하기

```bash
pnpm install
cp .env.example .env   # 환경변수 설정
pnpm db:push           # DB 스키마 적용
ADMIN_USERNAME=admin ADMIN_PASSWORD=pass pnpm register:admin
```

## 환경변수

| 키                     | 설명                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL 연결 문자열                                      |
| `JWT_SECRET`           | 관리자 JWT 서명용 시크릿 (`openssl rand -hex 64`)           |
| `JWT_REFRESH_SECRET`   | JWT 갱신용 시크릿 (`openssl rand -hex 64`)                  |
| `CF_API_TOKEN`         | Cloudflare Images API Token                                 |
| `CF_ACCOUNT_ID`        | Cloudflare Account ID                                       |
| `CF_ACCOUNT_HASH`      | Cloudflare Images Account Hash                              |
| `OPENAI_API`           | OpenAI API Key (또는 OpenRouter)                            |
| `OPENAI_BASE_URL`      | OpenAI API Base URL (기본값: `https://api.openai.com/v1`)   |
| `FAL_API`              | fal.ai API Key                                              |
| `PUBLIC_GITHUB_URL`    | (선택) GitHub 프로필 링크                                   |
| `PUBLIC_TWITTER_URL`   | (선택) Twitter 프로필 링크                                  |
