# Multi-stage build for Next.js SmartBin Frontend

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies (no frozen lockfile for development)
RUN npm install -g pnpm && \
    pnpm install --no-frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables (optional)
ARG NEXT_PUBLIC_AUTH_SERVICE_URL
ARG NEXT_PUBLIC_BIN_SERVICE_URL
ARG NEXT_PUBLIC_DETECTION_SERVICE_URL
ARG NEXT_PUBLIC_RECLAMATION_SERVICE_URL

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_AUTH_SERVICE_URL=${NEXT_PUBLIC_AUTH_SERVICE_URL}
ENV NEXT_PUBLIC_BIN_SERVICE_URL=${NEXT_PUBLIC_BIN_SERVICE_URL}
ENV NEXT_PUBLIC_DETECTION_SERVICE_URL=${NEXT_PUBLIC_DETECTION_SERVICE_URL}
ENV NEXT_PUBLIC_RECLAMATION_SERVICE_URL=${NEXT_PUBLIC_RECLAMATION_SERVICE_URL}

# Build the Next.js application
RUN npm install -g pnpm && \
    pnpm run build

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
