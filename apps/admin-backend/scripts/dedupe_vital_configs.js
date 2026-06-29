/**
 * Deduplication script: Removes duplicate (beneficiaryId, vitalDefinitionId) rows
 * in beneficiary_vital_configs, keeping only the most recently updated row per pair.
 * This is needed because the old unique constraint included effectiveFrom,
 * but the new constraint is simply (beneficiaryId, vitalDefinitionId).
 */
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function deduplicate() {
  const pool = new Pool({ connectionString });

  try {
    console.log('🔍 Checking for duplicate (beneficiaryId, vitalDefinitionId) pairs...');

    const dupeCheck = await pool.query(`
      SELECT "beneficiaryId", "vitalDefinitionId", COUNT(*) as cnt
      FROM beneficiary_vital_configs
      GROUP BY "beneficiaryId", "vitalDefinitionId"
      HAVING COUNT(*) > 1
    `);

    if (dupeCheck.rows.length === 0) {
      console.log('✅ No duplicates found — safe to push schema.');
      await pool.end();
      return;
    }

    console.log(`  Found ${dupeCheck.rows.length} duplicate pairs. Deduplicating...`);

    // Delete older duplicates — keep the one with the latest updatedAt
    const deleteResult = await pool.query(`
      DELETE FROM beneficiary_vital_configs
      WHERE id NOT IN (
        SELECT DISTINCT ON ("beneficiaryId", "vitalDefinitionId") id
        FROM beneficiary_vital_configs
        ORDER BY "beneficiaryId", "vitalDefinitionId", "updatedAt" DESC
      )
    `);

    console.log(`  ✅ Deleted ${deleteResult.rowCount} duplicate rows (kept most recent per pair)`);

    // Verify
    const verifyCheck = await pool.query(`
      SELECT "beneficiaryId", "vitalDefinitionId", COUNT(*) as cnt
      FROM beneficiary_vital_configs
      GROUP BY "beneficiaryId", "vitalDefinitionId"
      HAVING COUNT(*) > 1
    `);
    
    if (verifyCheck.rows.length === 0) {
      console.log('  ✅ Verification passed — no duplicates remain');
    } else {
      console.log('  ❌ Still found duplicates:', verifyCheck.rows);
    }

    // Also show remaining vital_definitions to check for code uniqueness
    const vitalDefs = await pool.query(`
      SELECT code, COUNT(*) as cnt FROM vital_definitions GROUP BY code HAVING COUNT(*) > 1
    `);
    if (vitalDefs.rows.length > 0) {
      console.log('\n⚠️  Duplicate vital_definition codes found (need (code,version) unique):');
      vitalDefs.rows.forEach(r => console.log(' ', r));
      
      // Fix: set version = 1 for all existing (they're all v1, pre-versioning)
      // and mark all as isLatestVersion = true (will add the column)
      console.log('  These will be fixed when prisma db push adds the version column.');
    } else {
      console.log('\n✅ vital_definitions codes are all unique — (code,version) constraint will work fine');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deduplicate();
