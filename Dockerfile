FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY server/ .

FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ .
RUN npm run build -- --configuration production

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=server-build /app/server /app/server
COPY --from=client-build /app/client/dist/client/browser /app/public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server/src/index.js"]
