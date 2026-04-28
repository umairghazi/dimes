FROM node:20-alpine
WORKDIR /app

# Install deps first (layer-cached unless package.json changes)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
