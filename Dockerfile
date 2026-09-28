# Multi-stage Dockerfile for Commute Buddy
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY database ./database

EXPOSE 3001 8080

CMD ["node", "server/index.js"]
