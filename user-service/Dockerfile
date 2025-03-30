FROM node:22-alpine

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy Prisma and package files first for better layer caching
COPY prisma ./prisma
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client (required)
RUN yarn prisma:generate

# Build the application
RUN yarn build

# Expose the application port
EXPOSE 3000

# Run migrations and start the application
CMD node dist/main