# Multi-stage build for Next.js SmartBin Frontend

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install dependencies using npm with legacy peer deps flag to handle Clerk conflicts
RUN npm install --legacy-peer-deps

# Copy all remaining source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build arguments for environment variables (with defaults)
ARG NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8001
ARG NEXT_PUBLIC_BIN_SERVICE_URL=http://localhost:8002
ARG NEXT_PUBLIC_DETECTION_SERVICE_URL=http://localhost:8003
ARG NEXT_PUBLIC_RECLAMATION_SERVICE_URL=http://localhost:8004
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Set as environment variables for build
ENV NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL
ENV NEXT_PUBLIC_BIN_SERVICE_URL=$NEXT_PUBLIC_BIN_SERVICE_URL
ENV NEXT_PUBLIC_DETECTION_SERVICE_URL=$NEXT_PUBLIC_DETECTION_SERVICE_URL
ENV NEXT_PUBLIC_RECLAMATION_SERVICE_URL=$NEXT_PUBLIC_RECLAMATION_SERVICE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

# Build the Next.js application
RUN npm run build

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
