FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g typescript

COPY . .

RUN npm run build

RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/dist/server.js"]
