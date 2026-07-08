import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load .env from the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

export default defineConfig({
  schema: "./prisma/schema.prisma",

  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
