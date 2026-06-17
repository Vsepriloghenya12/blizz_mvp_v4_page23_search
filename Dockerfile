# Stage 1: build Expo web app
FROM node:22-alpine AS web-builder
WORKDIR /mobile

COPY mobile/package-lock.json mobile/package.json ./
RUN npm ci

COPY mobile/ ./
ENV EXPO_PUBLIC_API_URL=""
RUN npx expo export --platform web --output-dir dist

# Stage 2: run API server + serve built web app
FROM node:22-alpine
WORKDIR /app

COPY server/package-lock.json server/package.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY --from=web-builder /mobile/dist ./public/app

EXPOSE 4000
CMD ["node", "src/server.js"]
