const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const applyMigrations = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL is not defined in your .env file.');
    process.exit(1);
  }

  const command = `psql "${dbUrl}" -f supabase/migrations/20250713_create_admin_dashboard_features.sql`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error applying migrations: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Migration stderr: ${stderr}`);
      return;
    }
    console.log(`Migration output: ${stdout}`);
    console.log('Migrations applied successfully.');
  });
};

applyMigrations();
