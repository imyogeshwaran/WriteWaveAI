# backend/Dockerfile - production multi-stage build
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy package info and install deps
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy rest of backend and the frontend folder (we expect frontend as ../frontend)
COPY . .

# Runtime image (smaller)
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy node_modules and app files from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app ./

ENV NODE_ENV=production
EXPOSE 3001

USER appuser
CMD ["node", "server.js"]

