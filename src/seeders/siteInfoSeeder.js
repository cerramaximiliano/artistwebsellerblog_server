const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const SiteInfo = require('../models/SiteInfo');

const seedSiteInfo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const siteInfoData = {
      biography: {
        title: 'Mirta Aguilar',
        subtitle: 'Artista Plástica Argentina',
        content: 'Mirta Aguilar es una reconocida artista plástica argentina con más de 30 años de trayectoria. Su obra se caracteriza por la exploración de formas abstractas y el uso vibrante del color, creando composiciones que evocan emociones profundas y reflexiones sobre la naturaleza humana.\n\nNacida en Buenos Aires, comenzó su formación artística en la Escuela Nacional de Bellas Artes, donde desarrolló su técnica y encontró su voz única como artista. A lo largo de su carrera, ha experimentado con diversas técnicas, desde el óleo tradicional hasta técnicas mixtas contemporáneas.',
        profileImage: {
          url: 'https://res.cloudinary.com/artist/image/upload/v1/profile/mirta-aguilar.jpg',
          alt: 'Mirta Aguilar - Artista Plástica'
        },
        highlights: [
          {
            year: 2023,
            achievement: 'Exposición individual en el Centro Cultural Recoleta'
          },
          {
            year: 2022,
            achievement: 'Participación en la Bienal de Arte Contemporáneo de Buenos Aires'
          },
          {
            year: 2021,
            achievement: 'Premio a la Trayectoria Artística - Fundación Arte BA'
          }
        ],
        exhibitions: [
          {
            year: 2023,
            title: 'Abstracto Infinito',
            location: 'Centro Cultural Recoleta, Buenos Aires',
            description: 'Muestra retrospectiva de los últimos 10 años de producción artística'
          },
          {
            year: 2022,
            title: 'Colores del Alma',
            location: 'Galería Zurbarán, Buenos Aires',
            description: 'Serie de obras explorando la relación entre color y emoción'
          },
          {
            year: 2021,
            title: 'Naturaleza Abstracta',
            location: 'Museo de Arte Moderno, Buenos Aires',
            description: 'Exposición colectiva de artistas contemporáneos argentinos'
          }
        ],
        awards: [
          {
            year: 2021,
            title: 'Premio a la Trayectoria Artística',
            organization: 'Fundación Arte BA'
          },
          {
            year: 2019,
            title: 'Mención de Honor',
            organization: 'Salón Nacional de Artes Visuales'
          }
        ]
      },
      contact: {
        email: 'mirtasusana16@hotmail.com',
        phone: '+54 11 4567-8900',
        whatsapp: '+54 9 11 3456-7890',
        address: {
          street: 'Av. Libertador 1234',
          city: 'Buenos Aires',
          province: 'Ciudad Autónoma de Buenos Aires',
          country: 'Argentina',
          postalCode: 'C1425'
        },
        socialMedia: {
          instagram: 'https://instagram.com/mirtasusanaaguilar',
          facebook: 'https://facebook.com/mirtasusanaaguilararte',
          linkedin: 'https://linkedin.com/in/mirta-susana-aguilar'
        },
        businessHours: {
          monday: { open: '10:00', close: '18:00', isClosed: false },
          tuesday: { open: '10:00', close: '18:00', isClosed: false },
          wednesday: { open: '10:00', close: '18:00', isClosed: false },
          thursday: { open: '10:00', close: '18:00', isClosed: false },
          friday: { open: '10:00', close: '18:00', isClosed: false },
          saturday: { open: '10:00', close: '14:00', isClosed: false },
          sunday: { open: '', close: '', isClosed: true }
        },
        mapLocation: {
          lat: -34.5875,
          lng: -58.3952
        }
      }
    };

    // Check if site info exists
    const existingSiteInfo = await SiteInfo.findOne();
    
    if (existingSiteInfo) {
      // Update existing
      Object.assign(existingSiteInfo, siteInfoData);
      existingSiteInfo.metadata.lastUpdated = new Date();
      await existingSiteInfo.save();
      console.log('✅ Información del sitio actualizada exitosamente');
    } else {
      // Create new
      await SiteInfo.create(siteInfoData);
      console.log('✅ Información del sitio creada exitosamente');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Información del sitio configurada');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedSiteInfo();