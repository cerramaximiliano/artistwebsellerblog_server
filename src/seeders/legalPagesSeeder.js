const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const SiteInfo = require('../models/SiteInfo');

const privacyPolicyContent = `## 1. Información que Recopilamos

En nuestra galería de arte, recopilamos información personal que usted nos proporciona voluntariamente, incluyendo:

- **Información de contacto**: nombre, correo electrónico, número de teléfono
- **Información de envío**: dirección postal para la entrega de obras
- **Información de pago**: procesada de forma segura a través de nuestros proveedores de pago

## 2. Uso de la Información

Utilizamos la información recopilada para:

- Procesar y gestionar sus compras de obras de arte
- Enviar confirmaciones de pedidos y actualizaciones de envío
- Responder a sus consultas y solicitudes
- Enviar información sobre nuevas obras y exposiciones (si se suscribe al newsletter)
- Mejorar nuestros servicios y experiencia del usuario

## 3. Protección de Datos

Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.

## 4. Compartir Información

No vendemos ni compartimos su información personal con terceros, excepto cuando sea necesario para:

- Procesar pagos (proveedores de servicios de pago)
- Realizar envíos (empresas de mensajería)
- Cumplir con obligaciones legales

## 5. Sus Derechos

Usted tiene derecho a:

- Acceder a sus datos personales
- Rectificar información inexacta
- Solicitar la eliminación de sus datos
- Oponerse al procesamiento de sus datos
- Retirar su consentimiento en cualquier momento

## 6. Cookies

Utilizamos cookies para mejorar su experiencia de navegación. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.

## 7. Contacto

Para cualquier consulta relacionada con esta política de privacidad, puede contactarnos a través de nuestra página de contacto.

## 8. Cambios en esta Política

Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios serán publicados en esta página con la fecha de última actualización.`;

const termsAndConditionsContent = `## 1. Aceptación de los Términos

Al acceder y utilizar este sitio web de galería de arte, usted acepta cumplir con estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, le solicitamos que no utilice nuestro sitio.

## 2. Descripción del Servicio

Este sitio web ofrece:

- Exhibición y venta de obras de arte originales
- Venta de reproducciones digitales de arte
- Información sobre la artista y su trayectoria
- Servicio de contacto para consultas y encargos especiales

## 3. Compras y Pagos

### 3.1 Precios
- Los precios mostrados están expresados en Pesos Argentinos (ARS)
- Los precios pueden estar sujetos a cambios sin previo aviso
- El precio aplicable será el vigente al momento de realizar la compra

### 3.2 Métodos de Pago
- Aceptamos pagos a través de MercadoPago
- Todas las transacciones son procesadas de forma segura

### 3.3 Confirmación de Compra
- Recibirá una confirmación por correo electrónico una vez procesado el pago
- La compra está sujeta a disponibilidad del producto

## 4. Envíos y Entregas

- Los envíos se realizan a todo el territorio argentino
- Los tiempos de entrega varían según la ubicación
- El comprador es responsable de proporcionar una dirección de envío correcta
- Las obras originales se envían con embalaje especial para su protección

## 5. Devoluciones y Reembolsos

### 5.1 Obras Originales
- Se aceptan devoluciones dentro de los 7 días posteriores a la recepción
- La obra debe estar en perfectas condiciones y con su embalaje original
- Los gastos de envío de devolución corren por cuenta del comprador

### 5.2 Arte Digital
- Las reproducciones digitales no admiten devolución una vez procesada la impresión
- En caso de defectos de fabricación, se procederá al reemplazo sin costo adicional

## 6. Propiedad Intelectual

- Todas las obras de arte mostradas son propiedad intelectual de Mirta Aguilar
- Está prohibida la reproducción no autorizada de las imágenes
- La compra de una obra no transfiere los derechos de autor

## 7. Uso del Sitio

El usuario se compromete a:

- Proporcionar información veraz y actualizada
- No utilizar el sitio para fines ilegales
- No intentar acceder a áreas restringidas del sitio
- Respetar los derechos de propiedad intelectual

## 8. Limitación de Responsabilidad

No nos hacemos responsables por:

- Daños indirectos derivados del uso del sitio
- Interrupciones temporales del servicio
- Errores tipográficos en descripciones o precios (que serán corregidos)

## 9. Modificaciones

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor desde su publicación en el sitio.

## 10. Legislación Aplicable

Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a los tribunales competentes de la Ciudad de Buenos Aires.

## 11. Contacto

Para cualquier consulta sobre estos términos, puede contactarnos a través de nuestra página de contacto.`;

const seedLegalPages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const legalPagesData = {
      privacyPolicy: {
        title: 'Política de Privacidad',
        content: privacyPolicyContent,
        lastUpdated: new Date()
      },
      termsAndConditions: {
        title: 'Términos y Condiciones',
        content: termsAndConditionsContent,
        lastUpdated: new Date()
      }
    };

    // Obtener o crear el documento SiteInfo
    let siteInfo = await SiteInfo.findOne();

    if (siteInfo) {
      // Actualizar solo las páginas legales
      siteInfo.legalPages = legalPagesData;
      siteInfo.metadata.lastUpdated = new Date();
      await siteInfo.save();
      console.log('✅ Páginas legales actualizadas en documento existente');
    } else {
      // Crear nuevo documento con datos mínimos
      siteInfo = await SiteInfo.create({
        biography: {
          title: 'Biografía',
          content: 'Información biográfica pendiente de actualizar.'
        },
        contact: {
          email: 'contacto@mirtaaguilar.art'
        },
        legalPages: legalPagesData
      });
      console.log('✅ Nuevo documento SiteInfo creado con páginas legales');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINAS LEGALES CONFIGURADAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
  ✓ Política de Privacidad: ${legalPagesData.privacyPolicy.content.length} caracteres
  ✓ Términos y Condiciones: ${legalPagesData.termsAndConditions.content.length} caracteres

  Las páginas están disponibles en:
  - /privacidad
  - /terminos

  Puedes editarlas desde el Dashboard > Legal
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedLegalPages();
