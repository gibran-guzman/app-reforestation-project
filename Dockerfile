FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
COPY server/ .

FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ .
RUN npm run build -- --configuration production

FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY --from=server-build /app/server /app/server
COPY --from=client-build /app/client/dist/client/browser /app/public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh", "-c", "node server/src/db/migrate.js && node server/src/index.js"]
