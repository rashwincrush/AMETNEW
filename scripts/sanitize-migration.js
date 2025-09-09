const fs = require('fs');

const path = process.argv[2];

if (!path) {
  console.error('Usage: node sanitize-migration.js <sql_file>');
  process.exit(1);
}

const sql = fs.readFileSync(path, 'utf8');

const lines = sql.split('\n');

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/DROP POLICY (\w+)/)) {
    const name = RegExp.$1;
    let created = false;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/CREATE (OR REPLACE )?POLICY (\w+)/) && RegExp.$2 === name) {
        created = true;
        break;
      }
    }
    if (!created) {
      newLines.push('-- ' + line);
    } else {
      newLines.push(line);
    }
  } else if (line.match(/DROP FUNCTION (\w+)/)) {
    const name = RegExp.$1;
    let created = false;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/CREATE (OR REPLACE )?FUNCTION (\w+)/) && RegExp.$2 === name) {
        created = true;
        break;
      }
    }
    if (!created) {
      newLines.push('-- ' + line);
    } else {
      newLines.push(line);
    }
  } else if (line.match(/DROP TABLE storage\.iceberg_namespaces|DROP TABLE storage\.iceberg_tables|DROP INDEX.*storage\.iceberg|DROP.*storage\.iceberg/)) {
    newLines.push(line);
  } else if (line.match(/DROP/)) {
    console.log('WARN: DROP: ' + line);
    newLines.push(line);
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync(path, newLines.join('\n'));
