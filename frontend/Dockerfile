FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
