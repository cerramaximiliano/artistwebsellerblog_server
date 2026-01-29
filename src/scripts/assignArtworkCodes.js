const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

// Esquema simplificado para la migración (sin required en code)
const artworkMigrationSchema = new mongoose.Schema({
  code: String,
  title: String
}, { strict: false });

const ArtworkMigration = mongoose.model('Artwork', artworkMigrationSchema, 'artworks');

// Generador de códigos secuenciales
class SequentialCodeGenerator {
  constructor(usedCodes = new Set()) {
    this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.usedCodes = usedCodes;
    // Encontrar el siguiente código disponible basándose en los existentes
    this.currentIndex = this.findStartIndex();
  }

  // Convierte un índice numérico a código (0 = AA000, 1 = AA001, etc.)
  indexToCode(index) {
    const letter1Index = Math.floor(index / (26 * 1000));
    const letter2Index = Math.floor((index % (26 * 1000)) / 1000);
    const number = index % 1000;

    if (letter1Index >= 26) {
      throw new Error('Se agotaron los códigos disponibles (máximo ZZ999)');
    }

    const letter1 = this.letters[letter1Index];
    const letter2 = this.letters[letter2Index];
    const numberStr = String(number).padStart(3, '0');

    return `${letter1}${letter2}${numberStr}`;
  }

  // Convierte un código a índice numérico
  codeToIndex(code) {
    const letter1Index = this.letters.indexOf(code[0]);
    const letter2Index = this.letters.indexOf(code[1]);
    const number = parseInt(code.slice(2), 10);

    return (letter1Index * 26 * 1000) + (letter2Index * 1000) + number;
  }

  // Encuentra el índice inicial basándose en códigos existentes
  findStartIndex() {
    if (this.usedCodes.size === 0) {
      return 1; // Empezar desde AA001
    }

    // Encontrar el máximo índice usado
    let maxIndex = -1;
    for (const code of this.usedCodes) {
      const index = this.codeToIndex(code);
      if (index > maxIndex) {
        maxIndex = index;
      }
    }

    return maxIndex + 1;
  }

  // Genera el siguiente código disponible
  next() {
    let code;
    do {
      code = this.indexToCode(this.currentIndex);
      this.currentIndex++;
    } while (this.usedCodes.has(code));

    this.usedCodes.add(code);
    return code;
  }
}

async function assignArtworkCodes() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado a MongoDB');

    // Obtener todas las obras
    const artworks = await ArtworkMigration.find({}).sort({ createdAt: 1 });
    console.log(`Encontradas ${artworks.length} obras en total`);

    // Recopilar códigos existentes
    const usedCodes = new Set();
    const artworksWithoutCode = [];

    for (const artwork of artworks) {
      if (artwork.code && /^[A-Z]{2}\d{3}$/.test(artwork.code)) {
        usedCodes.add(artwork.code);
        console.log(`✓ "${artwork.title}" ya tiene código: ${artwork.code}`);
      } else {
        artworksWithoutCode.push(artwork);
      }
    }

    console.log(`\nObras sin código: ${artworksWithoutCode.length}`);
    console.log('---');

    // Crear generador secuencial
    const codeGenerator = new SequentialCodeGenerator(usedCodes);

    // Asignar códigos a las obras que no tienen
    for (const artwork of artworksWithoutCode) {
      const newCode = codeGenerator.next();

      await ArtworkMigration.updateOne(
        { _id: artwork._id },
        { $set: { code: newCode } }
      );

      console.log(`✓ "${artwork.title}" → ${newCode}`);
    }

    console.log('---');
    console.log(`✓ Se asignaron códigos a ${artworksWithoutCode.length} obras`);

    // Verificar que todos tienen código único
    const verification = await ArtworkMigration.aggregate([
      { $match: { code: { $exists: true } } },
      { $group: { _id: '$code', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (verification.length > 0) {
      console.error('⚠️  ADVERTENCIA: Se encontraron códigos duplicados:', verification);
    } else {
      console.log('✓ Verificación: No hay códigos duplicados');
    }

    // Verificar obras sin código
    const withoutCode = await ArtworkMigration.countDocuments({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: '' }
      ]
    });

    if (withoutCode > 0) {
      console.error(`⚠️  ADVERTENCIA: ${withoutCode} obras aún sin código`);
    } else {
      console.log('✓ Verificación: Todas las obras tienen código');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');
  }
}

// Ejecutar el script
assignArtworkCodes();
