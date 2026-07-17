FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci
RUN npm run build --workspace @bhargavmahanta/envguard
RUN npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/envguard/package.json ./package.json
COPY --from=build /app/packages/envguard/dist ./dist
COPY README.md LICENSE ./

USER node
ENTRYPOINT ["node", "/app/dist/cli.js"]
CMD ["scan", "."]
