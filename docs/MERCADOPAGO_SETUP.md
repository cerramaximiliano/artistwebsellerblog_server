# Configuración de MercadoPago

## 1. Agregar Credenciales

En tu archivo `.env`, agrega las siguientes variables con tus credenciales de MercadoPago:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
```

## 2. Endpoints Disponibles

### Crear Preferencia de Pago
```
POST /api/checkout/create-preference
```

**Body de ejemplo:**
```json
{
  "items": [{
    "id": "artwork_id",
    "title": "Nombre de la obra",
    "price": 10000,
    "currency": "ARS",
    "description": "Descripción de la obra"
  }],
  "customer": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "1134567890",
    "dni": "12345678"
  },
  "shipping": {
    "method": "pickup", // "pickup", "delivery", "shipping"
    "address": "Calle 123",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "postalCode": "1234",
    "notes": "Notas de envío"
  },
  "billing": {
    "type": "consumer", // "consumer" o "business"
    "businessName": "Empresa SA",
    "cuit": "20-12345678-9"
  },
  "total": 10000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "preference_id",
    "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?...",
    "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?...",
    "orderId": "order_id",
    "orderNumber": "ORD-202412-0001"
  },
  "message": "Preferencia creada exitosamente"
}
```

### Webhook de Notificaciones
```
POST /api/webhook/mercadopago
```

Este endpoint recibe las notificaciones de MercadoPago automáticamente.

### Verificar Estado de Pago
```
GET /api/checkout/payment-status/:paymentId
```

## 3. Configurar Webhook en MercadoPago

1. Ingresa al [Panel de MercadoPago](https://www.mercadopago.com/developers/panel)
2. Ve a tu aplicación
3. En la sección "Webhooks", agrega la URL:
   ```
   https://tu-dominio.com/api/webhook/mercadopago
   ```
4. Selecciona el evento "Pagos"

## 4. URLs de Redirección

El sistema está configurado para redirigir a:
- **Éxito**: `{FRONTEND_URL}/payment-success`
- **Error**: `{FRONTEND_URL}/payment-failure`
- **Pendiente**: `{FRONTEND_URL}/payment-success`

## 5. Testing con Sandbox

Para probar en modo sandbox:
1. Usa las credenciales de prueba de MercadoPago
2. El response incluye `sandbox_init_point` para testing
3. Tarjetas de prueba:
   - **Aprobada**: 5031 7557 3453 0604
   - **Rechazada**: 5031 7557 3453 0612

## 6. Flujo de Pago

1. Frontend envía datos del carrito a `/api/checkout/create-preference`
2. Backend crea preferencia y guarda orden
3. Frontend redirige al usuario a `init_point`
4. Usuario completa el pago en MercadoPago
5. MercadoPago envía notificación al webhook
6. Backend actualiza orden y marca artworks como vendidos

## 7. Troubleshooting

### "MercadoPago no está configurado"
- Verifica que las variables estén en `.env`
- Reinicia el servidor después de agregar las variables

### No llegan notificaciones al webhook
- Verifica que la URL del webhook sea accesible públicamente
- Para desarrollo local, usa ngrok:
  ```bash
  ngrok http 5010
  ```
  Y configura la URL de ngrok en MercadoPago

### Error al crear preferencia
- Verifica que todos los campos requeridos estén presentes
- Revisa los logs del servidor para más detalles