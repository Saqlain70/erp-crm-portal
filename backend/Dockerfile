FROM node:20-bullseye-slim AS base
WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apt-get update -y && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
