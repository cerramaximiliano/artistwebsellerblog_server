# API de Arte Digital

## Descripción
Sistema completo para gestionar obras de arte digital basadas en obras originales. Permite crear versiones digitales reinterpretadas de cuadros existentes para venderlas como láminas, posters o canvas.

## Endpoints

### 1. Obtener todas las obras digitales
```
GET /api/digital-art
```

**Query Parameters:**
- `limit` (number): Límite de resultados (default: 20)
- `offset` (number): Offset para paginación (default: 0)
- `available` (boolean|'all'): Filtrar por disponibilidad
- `featured` (boolean): Filtrar por destacadas
- `sort` (string): Ordenamiento ('newest', 'oldest', 'price_asc', 'price_desc')
- `search` (string): Búsqueda por texto

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "digital_art_id",
      "title": "Los Reyes - Versión Digital",
      "originalArtworkId": {
        "_id": "artwork_id",
        "title": "Los Reyes",
        "artist": "Mirta Aguilar",
        "year": 2020
      },
      "version": "01",
      "description": "Reinterpretación digital...",
      "imageUrl": "https://...",
      "sizes": [
        {
          "size": "A4",
          "dimensions": "21 x 29.7 cm",
          "price": 15000,
          "currency": "ARS",
          "available": true
        }
      ],
      "available": true,
      "featured": true
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "pages": 1,
    "currentPage": 1
  }
}
```

### 2. Obtener una obra digital específica
```
GET /api/digital-art/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "digital_art_id",
    "title": "Los Reyes - Versión Digital",
    "originalArtworkId": { /* datos completos del artwork original */ },
    "artist": "Mirta Aguilar",
    "version": "01",
    "description": "Reinterpretación digital...",
    "digitalTechnique": "Reinterpretación digital con técnicas mixtas",
    "imageUrl": "https://...",
    "thumbnailUrl": "https://...",
    "mockupUrl": "https://...",
    "productType": "lamina",
    "sizes": [ /* array de tamaños disponibles */ ],
    "features": {
      "paperType": "Papel fotográfico premium 250g",
      "printing": "Impresión giclée de alta calidad",
      "edition": "Edición abierta",
      "signedAvailable": true
    },
    "category": "digital",
    "tags": ["reinterpretación", "moderno"],
    "available": true,
    "featured": true,
    "views": 123
  }
}
```

### 3. Obtener obras digitales por obra original
```
GET /api/digital-art/by-original/:originalId
```

Devuelve todas las versiones digitales de una obra original específica.

### 4. Crear obra digital (Admin)
```
POST /api/digital-art
Authorization: Bearer {token}
```

**Body:**
```json
{
  "title": "Título de la obra digital",
  "originalArtworkId": "artwork_id",
  "originalTitle": "Título original",
  "version": "01",
  "description": "Descripción detallada",
  "digitalTechnique": "Técnica utilizada",
  "imageUrl": "https://...",
  "thumbnailUrl": "https://...",
  "mockupUrl": "https://...",
  "productType": "lamina",
  "sizes": [
    {
      "size": "A4",
      "dimensions": "21 x 29.7 cm",
      "price": 15000,
      "currency": "ARS",
      "available": true
    }
  ],
  "features": {
    "paperType": "Papel fotográfico premium 250g",
    "printing": "Impresión giclée",
    "edition": "Edición abierta",
    "signedAvailable": true
  },
  "tags": ["tag1", "tag2"],
  "available": true,
  "featured": false
}
```

### 5. Actualizar obra digital (Admin)
```
PUT /api/digital-art/:id
Authorization: Bearer {token}
```

Body similar al de creación, todos los campos son opcionales.

### 6. Eliminar obra digital (Admin)
```
DELETE /api/digital-art/:id
Authorization: Bearer {token}
```

### 7. Actualizar disponibilidad (Admin)
```
PATCH /api/digital-art/:id/availability
Authorization: Bearer {token}
```

**Body:**
```json
{
  "available": true
}
```

### 8. Actualizar disponibilidad de tamaño (Admin)
```
PATCH /api/digital-art/:id/size-availability
Authorization: Bearer {token}
```

**Body:**
```json
{
  "sizeIndex": 0,
  "available": false
}
```

## Modelo de Datos

### DigitalArt Schema
- **title**: Título de la versión digital
- **originalArtworkId**: Referencia a la obra original
- **originalTitle**: Título de la obra original
- **artist**: Nombre del artista
- **version**: Versión de la reinterpretación
- **description**: Descripción detallada
- **digitalTechnique**: Técnica digital utilizada
- **imageUrl**: URL de la imagen principal
- **thumbnailUrl**: URL de la miniatura
- **mockupUrl**: URL del mockup enmarcado
- **productType**: Tipo de producto (lamina, poster, canvas)
- **sizes**: Array de tamaños disponibles con precios
- **features**: Características del producto físico
- **category**: Categoría (siempre "digital")
- **tags**: Etiquetas para búsqueda
- **available**: Disponibilidad general
- **featured**: Si está destacada
- **views**: Contador de vistas
- **timestamps**: createdAt, updatedAt

## Notas de Implementación

1. **Índices de búsqueda**: Se han creado índices de texto completo en `title` y `description`
2. **Referencias**: Las obras digitales siempre referencian una obra original
3. **Vistas**: Se incrementan automáticamente al consultar una obra individual
4. **Autenticación**: Las operaciones de escritura requieren token de admin
5. **Paginación**: Todos los listados incluyen información de paginación

## Ejemplos de Uso

### Listar obras digitales disponibles y destacadas
```bash
curl http://localhost:5010/api/digital-art?available=true&featured=true
```

### Buscar obras digitales
```bash
curl http://localhost:5010/api/digital-art?search=abstracto
```

### Obtener versiones digitales de una obra
```bash
curl http://localhost:5010/api/digital-art/by-original/artwork_id_aqui
```