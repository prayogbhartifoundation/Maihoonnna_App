import { Client } from 'pg';

const DIRECT_URL = "postgresql://postgres.ggjbkdlioayfegcsbprv:HarHarMahadev%4007@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString: DIRECT_URL });
  await client.connect();
  console.log('Connected to DB');
  
  const result = await client.query(`
    ALTER TABLE visits 
    ADD COLUMN IF NOT EXISTS "subscriberRating" INTEGER,
    ADD COLUMN IF NOT EXISTS "beneficiaryRating" INTEGER
  `);
  console.log('Migration result:', result.command);
  
  // Verify columns exist
  const check = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'visits' 
    AND column_name IN ('subscriberRating', 'beneficiaryRating')
  `);
  console.log('Columns found:', check.rows);
  
  await client.end();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
