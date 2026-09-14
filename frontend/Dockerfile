# ─────────────────────────────────────────────────────────────────
# MarineTrace Frontend Dockerfile (Multi-Stage)
# Target 'development': Vite live-reload dev server (port 5173)
# Target 'production': Lean Nginx Alpine static SPA server (port 80)
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Base & Dependencies ──────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies using layer caching
COPY package.json package-lock.json ./
RUN npm ci --silent || npm install

# ── Stage 2: Development (Used by docker-compose for live dev) ────
FROM base AS development

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ── Stage 3: Builder (Compiles TypeScript & Tailwind into dist/) ──
FROM base AS builder

COPY . .

ARG VITE_API_URL=""
ARG VITE_API_BASE_URL=""
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── Stage 4: Production (Production Nginx Web Server) ─────────────
FROM nginx:1.27-alpine AS production

# Copy custom Nginx configuration with SPA routing & security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
