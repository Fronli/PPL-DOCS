# Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy seluruh project (biar frontend ikut)
WORKDIR /app
COPY . .

# Build backend
WORKDIR /app/backend
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:18

WORKDIR /app

# Copy backend hasil build
COPY --from=builder /app/backend/src/public ./backend/public
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma

# Copy frontend (INI KUNCI UTAMA)
COPY --from=builder /app/frontend ./frontend

# Install production deps
WORKDIR /app/backend
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]