import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

async function main() {
  const patterns = [
    'src/components/**/*.stories..js',
    'src/components/**/*.stories..jsx',
  ];
  const files = await fg(patterns, { dot: false });
  let renamed = 0;
  for (const file of files) {
    const newPath = file.replace('.stories..js', '.stories.js').replace('.stories..jsx', '.stories.jsx');
    await fs.move(file, newPath, { overwrite: true });
    console.log('Renamed', file, '->', newPath);
    renamed++;
  }
  console.log(`Done. Renamed ${renamed} files.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
