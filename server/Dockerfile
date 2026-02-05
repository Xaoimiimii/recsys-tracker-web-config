# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package.json
COPY package.json ./

# Install all dependencies
RUN npm install

# Copy prisma schema and generate client
# Bước này sẽ tạo client tại src/generated (theo cấu hình schema của bạn)
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy files từ builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# --- FIX QUAN TRỌNG 1: Đưa Prisma Client (bao gồm cả file nhị phân) vào đúng chỗ trong dist ---
# Vì tsc không copy file engine của Prisma vào dist, ta phải copy thủ công folder đã generate
# vào đúng đường dẫn mà code đã biên dịch mong đợi (/app/dist/src/generated)
COPY --from=builder /app/src/generated ./dist/src/generated

# --- FIX QUAN TRỌNG 2: Giúp Node.js hiểu các import tuyệt đối 'src/...' ---
# Khi code gọi require('src/...'), Node sẽ tìm trong ./dist/src/...
ENV NODE_PATH=./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/src/main.js"]