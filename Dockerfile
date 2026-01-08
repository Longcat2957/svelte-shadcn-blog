# base 이미지 설정 및 corepack 활성화
# 보안: 안정성이 검증된 LTS(Long Term Support) 버전인 Node.js 22를 권장합니다.
FROM node:22-alpine AS base

# 보안: OS 패키지 업데이트 및 dumb-init 설치
# dumb-init은 Node.js 프로세스가 PID 1로 실행될 때 시그널 처리를 돕습니다.
RUN apk update && apk upgrade && apk add --no-cache dumb-init

RUN corepack enable
WORKDIR /app

# --- Stage 1: Dependencies ---
FROM base AS deps
# pnpm 9+ 이상인 경우 보안을 위해 pnpm-workspace.yaml도 함께 복사하는 것이 좋습니다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# --- Stage 2: Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# SvelteKit 빌드
# adapter-node를 사용하므로 build/ 디렉토리가 생성됩니다.
RUN pnpm run build

# --- Stage 3: Runner ---
FROM base AS runner
# base 이미지를 상속받아 dumb-init과 corepack 설정을 유지합니다.

# 보안: 프로덕션 환경 설정
ENV NODE_ENV=production

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# 빌드 결과물 복사
COPY --from=builder /app/build ./build

# 보안: root 권한 사용을 제한하고 node 사용자에게 소유권 부여
RUN chown -R node:node /app
USER node

# 포트 설정 및 실행
EXPOSE 3000
ENV PORT=3000

# 앱 실행 (dumb-init을 Entrypoint로 사용)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "build/index.js"]
