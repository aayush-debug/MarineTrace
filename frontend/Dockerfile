# ─────────────────────────────────────────────────────────────────
# MarineTrace Frontend Dockerfile
# Node.js 20 Alpine + Vite + React 19 + Tailwind CSS
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies (utilizing layer caching)
COPY package.json package-lock.json ./
RUN npm ci --silent || npm install

# Copy application source code
COPY . .

EXPOSE 5173

# Start Vite dev server on 0.0.0.0:5173 with polling enabled
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
