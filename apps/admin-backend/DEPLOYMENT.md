# Deployment Guide: MaiHoonNa Admin Backend

This document contains instructions for deploying the `admin-backend` to platforms like Railway or Render.

## Prerequisites

-   A PostgreSQL database (e.g., Supabase, Railway PG, Render PG).
-   Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.

## 1. Railway Deployment

1.  **Repository**: Connect your GitHub repository to Railway.
2.  **Root Directory**: Set the "Root Directory" to `apps/admin-backend`.
3.  **Build Command**: Railway should automatically pick up the `build` script in `package.json`. If not, set it to:
    ```bash
    npm run build
    ```
4.  **Start Command**: `npm run start` (or `node server.js`).
5.  **Environment Variables**:
    -   `DATABASE_URL`: Your production DB connection string.
    -   `NODE_ENV`: `production`
    -   `PORT`: `8080` (Railway will assign this).

> [!IMPORTANT]
> **Monorepo Issue**: If Railway cannot find `../../packages/database`, you might need to use the root directory as the deployment source and specify the "Start Command" as `node apps/admin-backend/server.js`. Alternatively, use our [copy-schema](#fallback-copying-schema) script.

---

## 2. Render Deployment

1.  **New Web Service**: Connect your repo.
2.  **Root Directory**: `apps/admin-backend`.
3.  **Build Command**: `npm run build`.
4.  **Start Command**: `npm run start`.
5.  **Environment Variables**: Same as above.

---

## 3. Fallback: Copying Schema

If your hosting provider strictly limits the build process to the `apps/admin-backend` directory and cannot access `packages/database`, follow these steps:

1.  Create a `prisma` folder in `apps/admin-backend`.
2.  Copy your `schema.prisma` into it.
3.  Update your `package.json` to point to the local schema:
    ```json
    "prisma": {
        "schema": "prisma/schema.prisma"
    }
    ```

You can automate this locally or during deployment by running:
`npm run copy-schema` (using our utility script).

---

## Common Mistakes to Avoid

-   **Prisma Client Not Generated**: Ensure `npm run build` runs *before* the server starts. Without `prisma generate`, the backend will crash with a "Prisma Client not found" error.
-   **Wrong DATABASE_URL**: If using Supabase, ensure you use the **Connection Pooler** URL for `DATABASE_URL` to avoid connection limits.
-   **Relative Paths**: Prisma's `schema` path in `package.json` is relative to where `prisma` command is run. In our setup, it's correctly set to `../../packages/database/prisma/schema.prisma`.
