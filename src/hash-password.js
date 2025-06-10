const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('motdepasse123', 10);
  console.log('Hash généré:', hash);
}
main();
