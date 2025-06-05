const { PrismaClient } = require('./generated/prisma'); // Chemin personnalisé ici

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connexion réussie à la base de données !");
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
