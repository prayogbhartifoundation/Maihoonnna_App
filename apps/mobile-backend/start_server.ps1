try { npx kill-port 8000 } catch {}
npx prisma generate
npx prisma db push --accept-data-loss
npm run dev
