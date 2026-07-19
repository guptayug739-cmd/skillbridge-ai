FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

RUN npm ci

COPY . .

RUN npm run build -w packages/shared
RUN npm run build -w packages/server
RUN npm run build -w packages/client

FROM node:20-alpine AS server

WORKDIR /app

COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@skillbridge/shared/dist

EXPOSE 5000

CMD ["node", "dist/index.js"]

FROM nginx:alpine AS client

COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
