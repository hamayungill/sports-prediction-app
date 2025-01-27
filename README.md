# DuelNow Backend Repository

This repository contains the backend services for DuelNow, structured as a monorepo and managed using Turborepo. It organizes and optimizes the development workflow for multiple services, enabling consistent tooling and efficient task management across all backend applications and packages.

This README provides:

- **Environment Setup:** Step-by-step instructions to configure your local environment, including environment variables and dependency requirements.
- **Project Build & Development:** Guidance on using Docker Compose and Turborepo to build and run services effectively.
- **Committing Code:** Guidelines on testing, linting, and committing code following best practices.
- **Core Turborepo Concepts:** Resources to understand how to leverage Turborepo for task management, caching, and dependency management in the monorepo.

With Turborepo, you can run tasks like builds, tests, and dependency installations across multiple workspaces efficiently, with tools that handle interdependencies, caching, and build pipelines—all aimed at boosting productivity and code quality in a monorepo setup.

## Table of Contents

- [DuelNow Backend Repository](#duelnow-backend-repository)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [Docker Desktop Setup](#docker-desktop-setup)
    - [Visual Studio Code Setup](#visual-studio-code-setup)
  - [Project Setup](#project-setup)
    - [Install Dependencies](#install-dependencies)
    - [Turborepo Commands](#turborepo-commands)
  - [Running Locally](#running-locally)
    - [Environment Setup](#environment-setup)
    - [Build Docker Images](#build-docker-images)
    - [Database Migration and Seeding](#database-migration-and-seeding)
    - [Running Services](#running-services)
      - [Running Backend Only](#running-backend-only)
      - [Run Entire Application (Frontend + Backend)](#run-entire-application-frontend--backend)
  - [Committing Code](#committing-code)
  - [Core Concepts: Turborepo](#core-concepts-turborepo)
  - [Useful Links](#useful-links)

---

## Prerequisites

- Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.
- Recommended VS Code extensions are installed.

### Docker Desktop Setup

The following are the recommended settings for running the local environment.

1. Got to Settings > Resources > Advanced
2. Set CPU limit to 8 or higher
3. Set Memory limit to 10 GB or higher
4. Set Swap to 1 GB or higher
5. Set Virtual disk limit to 248 GB or higher

### Visual Studio Code Setup

1. Open **Extensions** from the sidebar.
2. Locate **Recommended** extensions at the bottom.
3. Install each extension marked as “This extension is recommended by users of the current workspace.”
4. Refer to the `.vscode` directory for any specific configuration settings.

---

## Project Setup

### Install Dependencies

1. Install all dependencies:

   ```bash
   npm i
   npm i turbo --global # if you haven't installed Turborepo yet
   ```

2. Manage dependencies for specific apps or packages as needed:

   ```bash
   # Install a dependency in a specific workspace
   npm i -D ts-node --workspace=exposed-api

   # Uninstall a dependency from a specific workspace
   npm uninstall ts-node --workspace=cron-worker
   ```

### Turborepo Commands

Use `turbo run` to execute various tasks:

- Build all apps and packages:

  ```bash
  turbo run build
  ```

- Develop all apps and packages:

  ```bash
  turbo run dev
  ```

- Run multiple tasks simultaneously:

  ```bash
  turbo run build test lint
  ```

- Filter by app/package:

  ```bash
  turbo run build --filter=[app/package name]
  ```

- Filter multiple:

  ```bash
  turbo run build --filter=foo --filter=bar --filter=baz
  ```

---

## Running Locally

### Environment Setup

1. Remove any existing `.env` files in all apps to avoid conflicts.
2. Obtain the "Firebase Admin SDK" file from the **ENG QA** Vault in 1Password. Save it in the project root as `firebase-duelnow.json`.
3. Copy the `.env.local` file:

   ```bash
   cp .env.local .env
   ```

4. Fill in the empty environment variables at the top.

### Build Docker Images

Build the images only when:

- Running the services for the first time.
- Code changes have been made and need to be reflected.

Build all images in parallel:

```bash
docker compose build --parallel
```

Or, to build specific services only, you can specify them:

```bash
docker compose build service1 service2
```

Enable the backend profile explicitly when building the frontend service

```bash
docker compose --profile backend build frontend
```

_Note: Use the --parallel flag to speed up the build process for multiple services._

### Database Migration and Seeding

_Note: You only need to run the migration service when there are changes to Prisma._

1. To migrate and seed the database using Prisma:

   ```bash
   docker compose --profile migrate up
   ```

2. Once migration completes, clean up:

   ```bash
   docker compose --profile migrate down
   ```

### Running Services

#### Running Backend Only

1. Start backend services using Docker Compose:

   ```bash
   docker compose --profile backend up
   ```

   _Note: Workers may take a few seconds to fully initialize as Kafka completes its setup._

2. When you’re done, stop all running services with:

   ```bash
   docker compose --profile backend down
   ```

#### Run Entire Application (Frontend + Backend)

1. Clone the "frontend" repo
2. Setup frontend environment and fill in any required environment variables

   ```bash
   cd frontend
   cp .end.example .env
   ```

3. Start the application with

   ```bash
   cd backend
   docker compose --profile frontend --profile backend up
   ```

4. When you're done, stop all running services with:

   ```bash
   docker compose --profile frontend --profile backend down
   ```

_Note: When running the entire application, make sure all environment variables in both .env files (backend and frontend) are configured properly._

---

## Committing Code

1. Run necessary tests before committing:

   ```bash
   turbo run test
   ```

2. Commit your code following Angular commit message style:

   ```bash
   git add .
   git commit -m "fix: fixed API response payload"
   ```

3. Husky hooks should run automatically. If any lint errors occur, fix them and commit again:

   ```bash
   turbo run lint:fix
   ```

---

## Core Concepts: Turborepo

Turborepo is used to manage and optimize tasks across packages. Familiarize yourself with the following core Turborepo concepts:

- [Configuring tasks](https://turbo.build/repo/docs/crafting-your-repository/configuring-tasks)
- [Running tasks](https://turbo.build/repo/docs/crafting-your-repository/running-tasks)
- [Configuring turbo.json](https://turbo.build/repo/docs/reference/configuration)
- [Package and Task Graphs](https://turbo.build/repo/docs/core-concepts/package-and-task-graph)

To visualize task dependencies, run:

```bash
npm run graph
```

---

## Useful Links

Learn more about Turborepo:

- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

---
