const axios = require('axios');

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:5010/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Agregar token si tienes uno

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper para imprimir
const log = {
  title: (text) => console.log(`\n${colors.bright}${colors.blue}========== ${text} ==========${colors.reset}\n`),
  success: (text) => console.log(`${colors.green}✓ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}✗ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.cyan}ℹ ${text}${colors.reset}`),
  request: (method, url) => console.log(`${colors.yellow}→ ${method} ${url}${colors.reset}`),
  response: (data) => console.log(`${colors.bright}Response:${colors.reset}`, JSON.stringify(data, null, 2))
};

// Cliente axios con configuración base
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logs
api.interceptors.request.use(request => {
  log.request(request.method.toUpperCase(), request.url);
  if (request.data) {
    console.log('Body:', JSON.stringify(request.data, null, 2));
  }
  return request;
});

api.interceptors.response.use(
  response => {
    log.success(`Status: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.response(error.response.data);
    } else {
      log.error(`Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Tests
async function testDigitalArtRoutes() {
  let createdId = null;
  
  try {
    // 1. GET all digital artworks
    log.title('GET ALL DIGITAL ARTWORKS');
    try {
      const response = await api.get('/digital-art');
      log.response(response.data);
      if (response.data.data && response.data.data.length > 0) {
        createdId = response.data.data[0]._id;
        log.info(`Found ${response.data.data.length} digital artworks`);
      }
    } catch (error) {}

    // 2. GET with query parameters
    log.title('GET DIGITAL ARTWORKS WITH FILTERS');
    try {
      const response = await api.get('/digital-art?limit=5&available=true&featured=true&sort=price_asc');
      log.response(response.data);
    } catch (error) {}

    // 3. GET with search
    log.title('SEARCH DIGITAL ARTWORKS');
    try {
      const response = await api.get('/digital-art?search=digital');
      log.response(response.data);
    } catch (error) {}

    // 4. GET single digital artwork
    if (createdId) {
      log.title('GET SINGLE DIGITAL ARTWORK');
      try {
        const response = await api.get(`/digital-art/${createdId}`);
        log.response(response.data);
      } catch (error) {}
    }

    // 5. GET by original artwork
    log.title('GET DIGITAL ARTWORKS BY ORIGINAL');
    try {
      const response = await api.get('/digital-art/by-original/687cc12a14b35ed5f26563f2');
      log.response(response.data);
    } catch (error) {}

    // 6. POST - Create (requires auth)
    log.title('CREATE DIGITAL ARTWORK (NO AUTH)');
    try {
      const newArtwork = {
        title: "Test Digital Artwork",
        originalArtworkId: "687cc12a14b35ed5f26563f2",
        originalTitle: "Original Test",
        version: "99",
        description: "Test description",
        imageUrl: "https://example.com/test.jpg",
        sizes: [{
          size: "A4",
          dimensions: "21 x 29.7 cm",
          price: 10000,
          available: true
        }]
      };
      const response = await api.post('/digital-art', newArtwork);
      log.response(response.data);
    } catch (error) {
      log.info('Expected to fail without authentication');
    }

    // 7. POST with auth (if token available)
    if (ADMIN_TOKEN) {
      log.title('CREATE DIGITAL ARTWORK (WITH AUTH)');
      api.defaults.headers.common['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
      try {
        const newArtwork = {
          title: "Test Digital Artwork Authenticated",
          originalArtworkId: "687cc12a14b35ed5f26563f2",
          originalTitle: "Original Test",
          version: "99",
          description: "Test description with auth",
          imageUrl: "https://example.com/test-auth.jpg",
          sizes: [{
            size: "A4",
            dimensions: "21 x 29.7 cm",
            price: 10000,
            available: true
          }]
        };
        const response = await api.post('/digital-art', newArtwork);
        log.response(response.data);
        if (response.data.data) {
          createdId = response.data.data._id;
        }
      } catch (error) {}
    }

    // 8. PUT - Update (requires auth)
    if (createdId) {
      log.title('UPDATE DIGITAL ARTWORK (NO AUTH)');
      try {
        delete api.defaults.headers.common['Authorization'];
        const response = await api.put(`/digital-art/${createdId}`, {
          title: "Updated Title"
        });
        log.response(response.data);
      } catch (error) {
        log.info('Expected to fail without authentication');
      }
    }

    // 9. PATCH - Update availability
    if (createdId) {
      log.title('UPDATE AVAILABILITY (NO AUTH)');
      try {
        const response = await api.patch(`/digital-art/${createdId}/availability`, {
          available: false
        });
        log.response(response.data);
      } catch (error) {
        log.info('Expected to fail without authentication');
      }
    }

    // 10. PATCH - Update size availability
    if (createdId) {
      log.title('UPDATE SIZE AVAILABILITY (NO AUTH)');
      try {
        const response = await api.patch(`/digital-art/${createdId}/size-availability`, {
          sizeIndex: 0,
          available: false
        });
        log.response(response.data);
      } catch (error) {
        log.info('Expected to fail without authentication');
      }
    }

    // 11. DELETE (requires auth)
    if (createdId && ADMIN_TOKEN) {
      log.title('DELETE DIGITAL ARTWORK (WITH AUTH)');
      api.defaults.headers.common['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
      try {
        const response = await api.delete(`/digital-art/${createdId}`);
        log.response(response.data);
      } catch (error) {}
    }

    // 12. Test invalid ID
    log.title('TEST INVALID ID');
    try {
      const response = await api.get('/digital-art/invalid-id-12345');
      log.response(response.data);
    } catch (error) {
      log.info('Expected to fail with invalid ID');
    }

    // 13. Test non-existent ID
    log.title('TEST NON-EXISTENT ID');
    try {
      const response = await api.get('/digital-art/507f1f77bcf86cd799439011');
      log.response(response.data);
    } catch (error) {
      log.info('Expected to return 404');
    }

  } catch (error) {
    log.error('Unexpected error:', error.message);
  }

  log.title('TEST COMPLETED');
  log.info('All routes have been tested');
}

// Verificar si axios está instalado
try {
  require.resolve('axios');
  testDigitalArtRoutes();
} catch (e) {
  console.log(`
${colors.yellow}⚠️  axios is not installed. Install it with:${colors.reset}
${colors.cyan}npm install axios${colors.reset}

Or run this test with curl commands instead:
${colors.cyan}node src/scripts/testDigitalArtRoutes.js --curl${colors.reset}
`);
  
  if (process.argv.includes('--curl')) {
    console.log('\n' + colors.bright + 'CURL Commands for testing:' + colors.reset + '\n');
    
    console.log('# Get all digital artworks');
    console.log('curl -X GET http://localhost:5010/api/digital-art\n');
    
    console.log('# Get with filters');
    console.log('curl -X GET "http://localhost:5010/api/digital-art?limit=5&available=true&featured=true&sort=price_asc"\n');
    
    console.log('# Search');
    console.log('curl -X GET "http://localhost:5010/api/digital-art?search=digital"\n');
    
    console.log('# Get single artwork (replace ID)');
    console.log('curl -X GET http://localhost:5010/api/digital-art/YOUR_ID_HERE\n');
    
    console.log('# Get by original artwork');
    console.log('curl -X GET http://localhost:5010/api/digital-art/by-original/687cc12a14b35ed5f26563f2\n');
    
    console.log('# Create (requires auth - will fail)');
    console.log(`curl -X POST http://localhost:5010/api/digital-art \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Test Digital Artwork",
    "originalArtworkId": "687cc12a14b35ed5f26563f2",
    "originalTitle": "Original Test",
    "version": "99",
    "description": "Test description",
    "imageUrl": "https://example.com/test.jpg",
    "sizes": [{
      "size": "A4",
      "dimensions": "21 x 29.7 cm",
      "price": 10000,
      "available": true
    }]
  }'\n`);
    
    console.log('# Update (requires auth - will fail)');
    console.log(`curl -X PUT http://localhost:5010/api/digital-art/YOUR_ID_HERE \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Updated Title"}'\n`);
    
    console.log('# Update availability (requires auth - will fail)');
    console.log(`curl -X PATCH http://localhost:5010/api/digital-art/YOUR_ID_HERE/availability \\
  -H "Content-Type: application/json" \\
  -d '{"available": false}'\n`);
    
    console.log('# Delete (requires auth - will fail)');
    console.log('curl -X DELETE http://localhost:5010/api/digital-art/YOUR_ID_HERE\n');
  }
}