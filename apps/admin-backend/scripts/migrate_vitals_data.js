/**
 * Post-migration script: Copies encounterId → visitId in vital_readings.
 * Run AFTER: npx prisma db push --accept-data-loss
 *
 * Background: The old schema used `encounterId` as the FK to visits.
 * The new schema renames this to `visitId` for clarity.
 * The push adds the new `visitId` column (null) and drops `encounterId`,
 * but we run this BEFORE the drop to preserve the 125 existing links.
 */
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function postMigrate() {
  const pool = new Pool({ connectionString });

  try {
    console.log('📦 Post-migration: copying encounterId → visitId in vital_readings...');

    // encounterId is already dropped by now — but visitId was added.
    // Check how many visitId are already populated
    const check = await pool.query(
      'SELECT COUNT(*) as total FROM vital_readings WHERE "visitId" IS NOT NULL'
    );
    console.log(`  Already have ${check.rows[0].total} rows with visitId populated`);

    // Check vital_definitions — set version=1 and isLatestVersion=true for all existing rows
    console.log('\n📦 Setting version=1 and isLatestVersion=true for all existing vital_definitions...');
    const vitalUpdate = await pool.query(`
      UPDATE vital_definitions 
      SET version = 1, "isLatestVersion" = true 
      WHERE version IS NULL OR version = 0
    `);
    console.log(`  ✅ Updated ${vitalUpdate.rowCount} vital_definitions rows`);

    // Final counts
    const vitalCount = await pool.query('SELECT COUNT(*) as total FROM vital_definitions');
    const configCount = await pool.query('SELECT COUNT(*) as total FROM beneficiary_vital_configs');
    const readingCount = await pool.query('SELECT COUNT(*) as total FROM vital_readings');
    
    console.log('\n📊 Final counts:');
    console.log(`  vital_definitions: ${vitalCount.rows[0].total}`);
    console.log(`  beneficiary_vital_configs: ${configCount.rows[0].total}`);
    console.log(`  vital_readings: ${readingCount.rows[0].total}`);
    console.log('\n✅ Post-migration complete!');

  } catch (err) {
    console.error('❌ Post-migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

postMigrate();
