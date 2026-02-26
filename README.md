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

## 시작하기

```bash
pnpm install
cp .env.example .env   # 환경변수 설정
pnpm db:push           # DB 스키마 적용
ADMIN_USERNAME=admin ADMIN_PASSWORD=pass pnpm register:admin
```

## 환경변수

| 키              | 설명                                              |
| --------------- | ------------------------------------------------- |
| `DATABASE_URL`  | PostgreSQL 연결 문자열                            |
| `JWT_SECRET`    | 관리자 JWT 서명용 시크릿 (`openssl rand -hex 64`) |
| `CF_API_TOKEN`  | Cloudflare Images API Token                       |
| `CF_ACCOUNT_ID` | Cloudflare Account ID                             |

## Roadmap

- [ ] AI 기반 문서 작성 / 편집 기능
- [ ] AI 생성 이미지 삽입 기능
