# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for API URLs
ARG WEB_CONFIG_API_BASE_URL
ARG MODULE_API_BASE_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create .env file with API URLs for build
RUN echo "WEB_CONFIG_API_BASE_URL=${WEB_CONFIG_API_BASE_URL}" > .env && \
    echo "MODULE_API_BASE_URL=${MODULE_API_BASE_URL}" >> .env

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
