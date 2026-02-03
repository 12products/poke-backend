# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install dependencies
RUN yarn install --frozen-lockfile

# Generate Prisma client
RUN yarn prisma generate

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Generate Prisma client
RUN yarn prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV TZ=UTC

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
