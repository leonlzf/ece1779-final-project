# ---------- BUILD STAGE ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend ./
RUN npm run build

# ---------- RUNTIME STAGE ----------
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy built assets from previous stage
COPY --from=build /app/dist ./

# Nginx config for proxying /api -> backend
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

