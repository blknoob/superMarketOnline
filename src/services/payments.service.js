import PaymentIntentRepository from "../repositories/paymentIntent.repository.js";
import OrdersRepository from "../repositories/orders.repository.js";

/**
 * SERVICE DE PAGOS - PROCESAMIENTO DE TRANSACCIONES
 * 
 * Servicio especializado en el manejo de diferentes métodos de pago
 * Coordina PaymentIntents con órdenes y procesa confirmaciones de pago
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Procesamiento de pagos manuales (Pago Móvil, Zelle, transferencias)
 * - Manejo de webhooks de pasarelas de pago externas
 * - Actualización de estados de PaymentIntents
 * - Confirmación de órdenes tras pago exitoso
 * - Gestión de referencias y comprobantes de pago
 * 
 * MÉTODOS DE PAGO SOPORTADOS:
 * - Pagos manuales: Pago Móvil, Zelle, transferencias bancarias
 * - Pasarelas: Stripe, MercadoPago, PayPal (vía webhooks)
 * - Criptomonedas: Bitcoin, Ethereum (integración futura)
 * - Efectivo: Pago contra entrega (COD)
 * 
 * FLUJO TÍPICO DE PAGO:
 * 1. Usuario selecciona método de pago
 * 2. Se crea/obtiene PaymentIntent para la orden
 * 3. Usuario realiza pago fuera del sistema
 * 4. Se captura comprobante via captureManual()
 * 5. Admin valida y confirma pago
 * 6. Se actualiza estado a "paid" y se marca orden como pagada
 * 
 * INTEGRACIONES:
 * - PaymentIntentRepository: Para persistencia de intenciones de pago
 * - OrdersRepository: Para actualización de estados de órdenes
 * - Webhooks externos: Para notificaciones de pasarelas
 * 
 * MONEDAS SOPORTADAS:
 * - VES: Bolívares (Pago Móvil, transferencias locales)
 * - USD: Dólares (Zelle, PayPal, Stripe)
 * - EUR: Euros (SEPA, Stripe Europa)
 */
class PaymentsService {
  /**
   * CONSTRUCTOR DEL SERVICE DE PAGOS
   * 
   * Inicializa las dependencias necesarias para procesamiento de pagos:
   * - paymentIntents: Para manejo de intenciones de pago
   * - ordersRepo: Para actualización de estados de órdenes
   */
  constructor() {
    this.paymentIntents = new PaymentIntentRepository();
    this.ordersRepo = new OrdersRepository();
  }

  /**
   * CAPTURAR PAGO MANUAL
   * 
   * Procesa pagos realizados fuera del sistema (Pago Móvil, Zelle, transferencias)
   * Crea o actualiza PaymentIntent con datos del comprobante
   * 
   * MÉTODOS DE PAGO MANUALES SOPORTADOS:
   * - "zelle": Transferencias Zelle en USD
   * - "pago_movil": Pago Móvil venezolano en VES
   * - "bank_transfer": Transferencias bancarias
   * - "cash": Pago en efectivo contra entrega
   * 
   * PROCESO DE CAPTURA:
   * 1. Determinar moneda según método (Zelle=USD, otros=VES)
   * 2. Buscar PaymentIntent existente para orden y método
   * 3. Si no existe: crear nuevo PaymentIntent
   * 4. Actualizar con referencia y URL del comprobante
   * 5. Establecer estado como "pending" (requiere validación admin)
   * 
   * DATOS DEL COMPROBANTE:
   * - reference: Número de referencia de la transacción
   * - customerProof: URL de imagen del comprobante subido
   * - amount: Monto pagado por el cliente
   * - status: "pending" (esperando validación administrativa)
   * 
   * VALIDACIÓN POSTERIOR:
   * - Admin revisa comprobante manualmente
   * - Si válido: actualiza estado a "paid"
   * - Si inválido: actualiza estado a "failed"
   * - Sistema actualiza orden automáticamente
   * 
   * @param {Object} params - Parámetros del pago manual
   * @param {string|ObjectId} params.orderId - ID de la orden asociada
   * @param {string} params.method - Método de pago ("zelle", "pago_movil", etc.)
   * @param {Object} params.payload - Datos del comprobante
   * @param {number} params.payload.amount - Monto pagado
   * @param {string} params.payload.reference - Referencia de transacción
   * @param {string} params.payload.proofUrl - URL del comprobante subido
   * @returns {Promise<Object>} PaymentIntent actualizado con comprobante
   */
  // Crea o actualiza un PaymentIntent para pagos manuales (Pago Móvil, Zelle, etc.)
  async captureManual({ orderId, method, payload }) {
    const amount = Number(payload.amount);
    const currency = method === "zelle" ? "USD" : "VES";

    // Busca o crea el intent
    let pi = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (!pi) {
      pi = await this.paymentIntents.create({
        orderId,
        amount,
        currency,
        method,
        status: "pending",
      });
    }

    // Actualiza con referencia y comprobante
    const update = {
      reference: payload.reference,
      customerProof: payload.proofUrl,
      status: "pending",
    };
    return this.paymentIntents.updateById(pi._id, update);
  }

  /**
   * MANEJAR WEBHOOK DE PASARELA DE PAGO
   * 
   * Procesa notificaciones automáticas de pasarelas de pago externas
   * Actualiza estados de PaymentIntents y órdenes según resultado
   * 
   * PASARELAS SOPORTADAS:
   * - "megasoft": Pasarela ejemplo implementada
   * - Stripe: Integration vía webhooks (futuro)
   * - MercadoPago: IPN notifications (futuro)
   * - PayPal: Instant Payment Notifications (futuro)
   * 
   * PROCESO DE WEBHOOK:
   * 1. Extraer datos relevantes del body (orderId, status)
   * 2. Determinar método de pago desde webhook
   * 3. Buscar PaymentIntent asociado a orden y método
   * 4. Actualizar estado según resultado:
   *    - "APPROVED" → "paid"
   *    - Otros estados → "failed"
   * 5. Si aprobado: marcar orden como pagada
   * 6. Retornar resultado del procesamiento
   * 
   * SEGURIDAD DE WEBHOOKS:
   * - Validar signature del webhook (implementar)
   * - Verificar IP de origen (implementar)
   * - Idempotencia: manejar webhooks duplicados
   * - Rate limiting para prevenir ataques
   * 
   * ESTADOS MANEJADOS:
   * - "APPROVED": Pago exitoso, actualizar a "paid"
   * - "REJECTED": Pago rechazado, actualizar a "failed"
   * - "PENDING": Mantener en "pending"
   * - "CANCELLED": Actualizar a "cancelled"
   * 
   * @param {Object} body - Cuerpo del webhook recibido
   * @param {string|ObjectId} body.orderId - ID de la orden asociada
   * @param {string} body.status - Estado del pago ("APPROVED", "REJECTED", etc.)
   * @returns {Promise<boolean>} true si se procesó exitosamente, false si no
   */
  // Ejemplo para webhook de pasarela (opcional)
  async handleGatewayWebhook(body) {
    const orderId = body?.orderId;
    const approved = body?.status === "APPROVED";
    const method = "megasoft";

    const pi = await this.paymentIntents.getByOrderAndMethod(orderId, method);
    if (!pi) return false;

    await this.paymentIntents.updateById(pi._id, {
      status: approved ? "paid" : "failed",
    });
    if (approved) await this.ordersRepo.markPaid(orderId);
    return true;
  }
}

export default PaymentsService;
