# Digital Art API - Respuestas de Ejemplo

## 1. GET /api/digital-art - Listar todas las obras digitales

### Request
```bash
GET /api/digital-art
```

### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "features": {
        "paperType": "Papel fotográfico premium 250g",
        "printing": "Impresión giclée de alta calidad",
        "edition": "Edición abierta",
        "signedAvailable": true
      },
      "_id": "68865b271574703ffefd295f",
      "title": "Los Reyes - Versión Digital",
      "originalArtworkId": {
        "images": {
          "main": {
            "url": "https://res.cloudinary.com/dqyoeolib/image/upload/v1753006377/artworks/wdadip4hv4npkokrwzur.jpg"
          },
          "thumbnail": {
            "url": "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_300/v1753006377/artworks/wdadip4hv4npkokrwzur.jpg"
          },
          "gallery": []
        },
        "_id": "687cc12a14b35ed5f26563f2",
        "title": "Los Reyes",
        "artist": "Mirta Susana Aguilar",
        "year": 2019
      },
      "originalTitle": "Los Reyes",
      "artist": "Mirta Susana Aguilar",
      "version": "01",
      "description": "Reinterpretación digital de la obra original \"Los Reyes\"...",
      "digitalTechnique": "Reinterpretación digital con técnicas mixtas",
      "imageUrl": "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
      "thumbnailUrl": "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
      "mockupUrl": null,
      "productType": "lamina",
      "sizes": [
        {
          "size": "A4",
          "dimensions": "21 x 29.7 cm",
          "price": 25000,
          "currency": "ARS",
          "available": true,
          "_id": "68865cc4690fd91edf4cbb73"
        },
        {
          "size": "A3",
          "dimensions": "29.7 x 42 cm",
          "price": 35000,
          "currency": "ARS",
          "available": true,
          "_id": "68865cc4690fd91edf4cbb74"
        },
        {
          "size": "A2",
          "dimensions": "42 x 59.4 cm",
          "price": 55000,
          "currency": "ARS",
          "available": true,
          "_id": "68865cc4690fd91edf4cbb75"
        }
      ],
      "category": "digital",
      "tags": ["reinterpretación", "moderno", "decorativo", "juvenil"],
      "available": true,
      "featured": true,
      "views": 0,
      "__v": 1,
      "createdAt": "2025-07-27T17:00:23.892Z",
      "updatedAt": "2025-07-27T17:23:26.752Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "pages": 1,
    "currentPage": 1
  }
}
```

### Query Parameters
- `limit`: número de resultados (default: 20)
- `offset`: para paginación (default: 0)
- `available`: true/false/'all' (default: muestra todos)
- `featured`: true/false
- `sort`: 'newest', 'oldest', 'price_asc', 'price_desc'
- `search`: búsqueda por texto

## 2. GET /api/digital-art/:id - Obtener una obra digital

### Request
```bash
GET /api/digital-art/68865b271574703ffefd295f
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    "features": {
      "paperType": "Papel fotográfico premium 250g",
      "printing": "Impresión giclée de alta calidad",
      "edition": "Edición abierta",
      "signedAvailable": true
    },
    "_id": "68865b271574703ffefd295f",
    "title": "Los Reyes - Versión Digital",
    "originalArtworkId": {
      // Objeto completo del artwork original con todos sus datos
      "images": { /* ... */ },
      "pricing": { /* ... */ },
      "status": { /* ... */ },
      "_id": "687cc12a14b35ed5f26563f2",
      "title": "Los Reyes",
      "artist": "Mirta Susana Aguilar",
      "description": "Obra rostros humanos en óleo",
      "year": 2019,
      "technique": "Óleo sobre lienzo",
      "dimensions": "80 x 80 cm",
      // ... más campos
    },
    "originalTitle": "Los Reyes",
    "artist": "Mirta Susana Aguilar",
    "version": "01",
    "description": "Reinterpretación digital...",
    "digitalTechnique": "Reinterpretación digital con técnicas mixtas",
    "imageUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "mockupUrl": null,
    "productType": "lamina",
    "sizes": [ /* array de tamaños */ ],
    "category": "digital",
    "tags": ["reinterpretación", "moderno", "decorativo", "juvenil"],
    "available": true,
    "featured": true,
    "views": 1, // Se incrementa automáticamente
    "__v": 1,
    "createdAt": "2025-07-27T17:00:23.892Z",
    "updatedAt": "2025-07-27T17:28:14.726Z"
  },
  "message": "Operación exitosa"
}
```

### Response Error - ID inválido (500)
```json
{
  "success": false,
  "error": {
    "code": "ERROR",
    "message": "Cast to ObjectId failed for value \"invalid-id-12345\" (type string) at path \"_id\" for model \"DigitalArt\""
  }
}
```

### Response Error - No encontrado (404)
```json
{
  "success": false,
  "error": {
    "code": "ERROR",
    "message": "Obra digital no encontrada"
  }
}
```

## 3. GET /api/digital-art/by-original/:originalId - Por obra original

### Request
```bash
GET /api/digital-art/by-original/687cc12a14b35ed5f26563f2
```

### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      // Array de todas las versiones digitales de esa obra
      "_id": "68865b271574703ffefd295f",
      "title": "Los Reyes - Versión Digital",
      "originalArtworkId": "687cc12a14b35ed5f26563f2",
      "version": "01",
      // ... resto de campos
    }
  ],
  "message": "Operación exitosa"
}
```

## 4. POST /api/digital-art - Crear obra digital (Admin)

### Request
```bash
POST /api/digital-art
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Nueva Obra Digital",
  "originalArtworkId": "687cc12a14b35ed5f26563f2",
  "originalTitle": "Obra Original",
  "version": "01",
  "description": "Descripción detallada",
  "digitalTechnique": "Técnica utilizada",
  "imageUrl": "https://ejemplo.com/imagen.jpg",
  "sizes": [{
    "size": "A4",
    "dimensions": "21 x 29.7 cm",
    "price": 15000,
    "available": true
  }]
}
```

### Response Success (201)
```json
{
  "success": true,
  "data": {
    // Obra creada con ID generado
    "_id": "nuevo_id_generado",
    // ... todos los campos
  },
  "message": "Obra digital creada exitosamente"
}
```

### Response Error - Sin autenticación (401)
```json
{
  "error": "Please authenticate"
}
```

### Response Error - Validación (400)
```json
{
  "success": false,
  "error": {
    "code": "ERROR",
    "message": "DigitalArt validation failed: title: Path `title` is required."
  }
}
```

## 5. PUT /api/digital-art/:id - Actualizar obra digital (Admin)

### Request
```bash
PUT /api/digital-art/68865b271574703ffefd295f
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Título Actualizado",
  "description": "Nueva descripción"
}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    // Obra actualizada
  },
  "message": "Obra digital actualizada exitosamente"
}
```

## 6. PATCH /api/digital-art/:id/availability - Cambiar disponibilidad (Admin)

### Request
```bash
PATCH /api/digital-art/68865b271574703ffefd295f/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "available": false
}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    // Obra con disponibilidad actualizada
    "available": false
  },
  "message": "Disponibilidad actualizada exitosamente"
}
```

## 7. PATCH /api/digital-art/:id/size-availability - Cambiar disponibilidad de tamaño (Admin)

### Request
```bash
PATCH /api/digital-art/68865b271574703ffefd295f/size-availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "sizeIndex": 0,  // Índice del tamaño en el array
  "available": false
}
```

### Response Success (200)
```json
{
  "success": true,
  "data": {
    // Obra con el tamaño específico actualizado
    "sizes": [
      {
        "size": "A4",
        "available": false  // Cambiado
      }
    ]
  },
  "message": "Disponibilidad del tamaño actualizada exitosamente"
}
```

## 8. DELETE /api/digital-art/:id - Eliminar obra digital (Admin)

### Request
```bash
DELETE /api/digital-art/68865b271574703ffefd295f
Authorization: Bearer {token}
```

### Response Success (200)
```json
{
  "success": true,
  "data": null,
  "message": "Obra digital eliminada exitosamente"
}
```

## Estructura de Respuestas

### Respuesta exitosa
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Mensaje opcional"
}
```

### Respuesta con paginación
```json
{
  "success": true,
  "data": [ /* array de items */ ],
  "pagination": {
    "total": 10,
    "limit": 20,
    "offset": 0,
    "pages": 1,
    "currentPage": 1
  }
}
```

### Respuesta de error
```json
{
  "success": false,
  "error": {
    "code": "ERROR",
    "message": "Descripción del error"
  }
}
```

### Error de autenticación (401)
```json
{
  "error": "Please authenticate"
}
```

## Notas importantes para el cliente

1. **Autenticación**: Las rutas de admin requieren header `Authorization: Bearer {token}`
2. **IDs**: Deben ser ObjectId válidos de MongoDB (24 caracteres hexadecimales)
3. **Paginación**: Usar `limit` y `offset` para paginar resultados
4. **Búsqueda**: El campo `search` busca en título y descripción
5. **Vistas**: Se incrementan automáticamente al consultar una obra individual
6. **Imágenes**: Las URLs de Cloudinary son públicas y accesibles directamente