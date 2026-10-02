/**
 * CONTROLLER DE PAGOS - PROCESAMIENTO DE MÉTODOS DE PAGO
 * 
 * Controller que maneja diferentes métodos de pago del sistema
 * Procesa pagos manuales y webhooks de pasarelas externas
 * 
 * MÉTODOS DE PAGO SOPORTADOS:
 * - Pago Móvil (Venezuela): Transferencias con comprobante
 * - Zelle (Internacional): Transferencias en USD
 * - Webhooks de pasarelas: Notificaciones automáticas
 * 
 * CARACTERÍSTICAS:
 * - Captura de comprobantes de pago
 * - Validación de datos de transacción
 * - Integración con sistema de archivos para comprobantes
 * - Webhooks para pasarelas automatizadas
 * - Redirecciones a páginas de confirmación
 * 
 * FLUJO TÍPICO:
 * 1. Usuario selecciona método de pago
 * 2. Realiza transferencia externa
 * 3. Reporta pago con comprobante
 * 4. Sistema captura datos y comprobante
 * 5. Redirige a página de confirmación
 * 6. Admin valida y confirma pago
 */
import PaymentsService from "../services/payments.service.js";
const paymentsService = new PaymentsService();

/**
 * REPORTAR PAGO MÓVIL
 * 
 * Endpoint: POST /payments/pago-movil/:orderId
 * Captura datos de transferencia Pago Móvil venezolano
 * 
 * BODY PARAMETERS:
 * - bank: Código del banco (0102, 0108, etc.)
 * - phone: Teléfono asociado al Pago Móvil
 * - docId: Cédula de identidad del titular
 * - reference: Número de referencia de la transferencia
 * - amount: Monto transferido en bolívares
 * 
 * FILE UPLOAD:
 * - req.file: Comprobante de pago subido
 * - Se guarda en /comprobantes/ con nombre único
 * - URL generada para referencia posterior
 * 
 * PROCESO:
 * 1. Extraer datos del formulario y archivo
 * 2. Crear payload con información del pago
 * 3. Capturar pago via PaymentsService
 * 4. Redirigir a página de confirmación
 * 
 * VALIDACIONES:
 * - Orden debe existir y pertenecer al usuario
 * - Datos obligatorios presentes
 * - Formato de referencia válido
 * - Comprobante de imagen subido
 * 
 * @param {Object} req - Request con params.orderId, body data y file
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Redirección a página de gracias
 */
export const reportPagoMovil = async (req, res, next) => {
  try {
    const { bank, phone, docId, reference, amount } = req.body;
    const { orderId } = req.params;
    const proofUrl = req.file ? `/comprobantes/${req.file.filename}` : undefined;

    await paymentsService.captureManual({
      orderId,
      method: "pago_movil",
      payload: { bank, phone, docId, reference, amount, proofUrl }
    });

    res.redirect(`/checkout/thanks/${orderId}`);
  } catch (e) { next(e); }
};

/**
 * REPORTAR PAGO ZELLE
 * 
 * Endpoint: POST /payments/zelle/:orderId
 * Captura datos de transferencia Zelle internacional
 * 
 * BODY PARAMETERS:
 * - email: Email asociado a la cuenta Zelle
 * - reference: Número de referencia de Zelle
 * - amount: Monto transferido en USD
 * 
 * CARACTERÍSTICAS DE ZELLE:
 * - Transferencias instantáneas en USD
 * - No requiere comprobante físico
 * - Referencia autogenerada por Zelle
 * - Validación por email del remitente
 * 
 * PROCESO:
 * 1. Extraer datos del formulario
 * 2. Validar formato de email y referencia
 * 3. Capturar pago con método "zelle"
 * 4. Crear registro pendiente de validación
 * 5. Redirigir a confirmación
 * 
 * VALIDACIONES:
 * - Email válido del remitente
 * - Referencia de Zelle válida
 * - Monto en USD coherente con orden
 * - Orden activa y del usuario actual
 * 
 * MONEDA:
 * - Siempre en USD (dólares estadounidenses)
 * - Conversión manejada en frontend
 * 
 * @param {Object} req - Request con params.orderId y body data
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware para errores
 * @returns {Promise<void>} Redirección a página de gracias
 */
export const reportZelle = async (req, res, next) => {
  try {
    const { email, reference, amount } = req.body;
    const { orderId } = req.params;

    await paymentsService.captureManual({
      orderId,
      method: "zelle",
      payload: { email, reference, amount }
    });

    res.redirect(`/checkout/thanks/${orderId}`);
  } catch (e) { next(e); }
};

/**
 * WEBHOOK DE PASARELA DE PAGO
 * 
 * Endpoint: POST /payments/webhook
 * Recibe notificaciones automáticas de pasarelas de pago externas
 * 
 * FUNCIONALIDAD:
 * - Procesar notificaciones de Stripe, MercadoPago, PayPal, etc.
 * - Actualizar estado de PaymentIntents automáticamente
 * - Confirmar órdenes cuando el pago es exitoso
 * - Manejar fallos y cancelaciones
 * 
 * PROCESO DEL WEBHOOK:
 * 1. Recibir payload de la pasarela
 * 2. Validar signature y autenticidad
 * 3. Extraer datos relevantes (orderId, status)
 * 4. Actualizar PaymentIntent correspondiente
 * 5. Cambiar estado de orden si es necesario
 * 6. Responder con código HTTP apropiado
 * 
 * SEGURIDAD:
 * - Validación de signatures de webhooks
 * - Verificación de IP de origen
 * - Idempotencia para webhooks duplicados
 * - Rate limiting para prevenir ataques
 * 
 * PASARELAS SOPORTADAS:
 * - Stripe: payment_intent.succeeded/failed
 * - MercadoPago: IPN notifications
 * - PayPal: Instant Payment Notifications
 * - Otros: Extensible para nuevas integraciones
 * 
 * RESPUESTAS:
 * - 200: Webhook procesado exitosamente
 * - 400: Error en procesamiento o datos inválidos
 * 
 * @param {Object} req - Request con body del webhook
 * @param {Object} res - Response de Express
 * @returns {Promise<void>} Status code sin contenido
 */
// Webhook para pasarela de pago (opcional)
export const gatewayWebhook = async (req, res) => {
  const ok = await paymentsService.handleGatewayWebhook(req.body);
  res.status(ok ? 200 : 400).end();
};
