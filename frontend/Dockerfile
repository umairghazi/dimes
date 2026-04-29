# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

# Baked in at build time by Railway build argument
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Serve stage — tiny final image, no source or devDeps
FROM node:20-alpine
RUN npm install -g serve@14
COPY --from=builder /app/dist /dist
CMD ["sh", "-c", "serve -s /dist -l ${PORT:-3000}"]
