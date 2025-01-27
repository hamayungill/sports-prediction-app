FROM node:20-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set the working directory inside the container
WORKDIR /app
# Install turbo globally
RUN npm i -g turbo
# Copy all files from the current directory to the container
COPY . .

# Prune the workspace to include only the necessary files for the target workspace
RUN turbo prune web3-worker --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
# Set the working directory inside the container
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
# Copy the output files from the builder stage
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Copy the full pruned workspace from the builder stage
COPY --from=builder /app/out/full/ .
COPY healthy healthy

# Initialize and build the project
RUN npm run build -- --filter=web3-worker...

FROM base AS runner
# Set the working directory inside the container
WORKDIR /app

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs

# Change ownership and permissions of the application directory
RUN chown -R expressjs:expressjs /app
RUN chmod 755 /app

# Switch to the non-root user
USER expressjs

# Copy the application files from the installer stage
COPY --from=installer /app .

# Start the application
CMD node apps/web3-worker/dist/runWorker.js
