# Multi-stage build for Next.js SmartBin Frontend
# Simplified to match local docker-compose setup

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm (same as local setup)
RUN npm install -g pnpm

# Copy package files and config first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Copy .npmrc for pnpm hoisting (critical for module resolution)
COPY .npmrc ./

# Install dependencies (same command as local)
# Using --shamefully-hoist via .npmrc to match local behavior
RUN pnpm install --frozen-lockfile

# Copy source files explicitly (avoiding node_modules which is in .dockerignore)
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY styles ./styles
COPY public ./public
COPY tsconfig.json next.config.mjs postcss.config.mjs components.json middleware.ts next-env.d.ts* ./

# Verify critical files exist
RUN test -d lib && test -d app && test -d components && echo "✓ Source files copied" || (echo "✗ Missing source files!" && exit 1)
RUN test -d node_modules/next && test -d node_modules/react && echo "✓ Dependencies available" || (echo "✗ Dependencies missing!" && exit 1)

# Set environment variables for build (BEFORE build command)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build arguments with defaults
ARG NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8001
ARG NEXT_PUBLIC_BIN_SERVICE_URL=http://localhost:8002
ARG NEXT_PUBLIC_DETECTION_SERVICE_URL=http://localhost:8003
ARG NEXT_PUBLIC_RECLAMATION_SERVICE_URL=http://localhost:8004
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy
ARG CLERK_SECRET_KEY=sk_test_dummy

# Set as environment variables (must be set before build)
ENV NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL
ENV NEXT_PUBLIC_BIN_SERVICE_URL=$NEXT_PUBLIC_BIN_SERVICE_URL
ENV NEXT_PUBLIC_DETECTION_SERVICE_URL=$NEXT_PUBLIC_DETECTION_SERVICE_URL
ENV NEXT_PUBLIC_RECLAMATION_SERVICE_URL=$NEXT_PUBLIC_RECLAMATION_SERVICE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Build (same as local would do for production)
RUN pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
