const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'public', 'logo.png');

if (fs.existsSync(logoPath)) {
  console.log('\x1b[32m%s\x1b[0m', 'logo.png found in frontend/public/. Proceeding with deployment.');
  process.exit(0);
} else {
  console.error('\x1b[31m%s\x1b[0m', 'Error: logo.png not found in frontend/public/. Halting deployment.');
  process.exit(1);
}
