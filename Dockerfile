FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci
RUN npm run build --workspace @bhargavmahanta/envguard-core
RUN npm run build --workspace @bhargavmahanta/envguard-reporters
RUN npm run build --workspace @bhargavmahanta/envguard
RUN npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/envguard-core/package.json /app/packages/envguard-core/package.json
COPY --from=build /app/packages/envguard-core/dist /app/packages/envguard-core/dist
COPY --from=build /app/packages/envguard-reporters/package.json /app/packages/envguard-reporters/package.json
COPY --from=build /app/packages/envguard-reporters/dist /app/packages/envguard-reporters/dist
COPY --from=build /app/packages/envguard/package.json /app/packages/envguard/package.json
COPY --from=build /app/packages/envguard/dist /app/packages/envguard/dist
COPY README.md LICENSE /app/packages/envguard/

USER node
ENTRYPOINT ["node", "/app/packages/envguard/dist/cli.js"]
CMD ["scan", "."]
