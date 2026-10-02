/**
 * MODELO DE INTENCIONES DE PAGO (PAYMENT INTENTS)
 * 
 * Este modelo maneja las intenciones de pago asociadas a órdenes de compra.
 * Controla todo el proceso de pago desde la solicitud hasta la confirmación,
 * incluyendo diferentes métodos de pago y verificación de comprobantes.
 * 
 * Propósito principal:
 * - Separar la lógica de órdenes de la lógica de pagos
 * - Permitir múltiples intentos de pago para una misma orden
 * - Gestionar diferentes métodos de pago (Pago Móvil, Zelle, Transferencias)
 * - Almacenar comprobantes y referencias de pago
 * - Controlar estados del proceso de pago
 * 
 * Flujo de vida de un PaymentIntent:
 * 1. Se crea cuando el usuario selecciona método de pago
 * 2. Estado inicial: "pending"
 * 3. Usuario sube comprobante/referencia
 * 4. Administrador verifica -> "verified" 
 * 5. Sistema procesa -> "paid"
 * 6. Orden asociada cambia a "paid"
 * 7. Se genera Ticket final
 * 
 * Estados de error:
 * - "failed": Pago rechazado o con problemas
 * 
 * Relaciones:
 * - Pertenece a UNA orden (paymentIntent.orderId)
 * - Una orden puede tener múltiples PaymentIntents (reintentos)
 */

import mongoose from "mongoose";

/**
 * ESQUEMA DE INTENCIONES DE PAGO
 * Define todos los campos necesarios para gestionar pagos
 */
const PaymentIntentSchema = new mongoose.Schema({
  /**
   * REFERENCIA A LA ORDEN
   * ObjectId que apunta a la orden que se está pagando
   * - Una intención de pago siempre está asociada a una orden
   * - Permite obtener detalles de la compra (productos, usuario, total)
   * - Se usa para actualizar el estado de la orden cuando se confirma el pago
   */
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  
  /**
   * MONTO DEL PAGO
   * Cantidad que se debe pagar por la orden
   * - Debe coincidir con el total de la orden
   * - Se usa para verificar que el pago sea correcto
   * - Puede incluir descuentos o recargos adicionales
   */
  amount: { type: Number, required: true },
  
  /**
   * MONEDA DEL PAGO
   * Define en qué moneda se realiza el pago
   * - "VES": Bolívares venezolanos (para Pago Móvil)
   * - "USD": Dólares estadounidenses (para Zelle/Transferencias)
   * - Por defecto USD
   * - Se usa para calcular conversiones si es necesario
   */
  currency: { type: String, enum: ["VES", "USD"], default: "USD" },
  
  /**
   * MÉTODO DE PAGO SELECCIONADO
   * Define cómo el usuario va a realizar el pago
   * 
   * Métodos soportados:
   * - "pago_movil": Pago Móvil (Venezuela) - requiere referencia
   * - "zelle": Zelle (USA) - no requiere referencia, solo email
   * - "transfer": Transferencia bancaria - requiere referencia
   * 
   * Cada método tiene sus propias validaciones y requerimientos
   */
  method: { type: String, enum: ["pago_movil", "zelle", "transfer"], required: true },
  
  /**
   * ESTADO DEL PROCESO DE PAGO
   * Controla el flujo del pago desde inicio hasta confirmación
   * 
   * Estados del flujo:
   * - "pending": Intención creada, esperando acción del usuario
   * - "verified": Comprobante verificado por administrador
   * - "paid": Pago confirmado y procesado exitosamente
   * - "failed": Pago rechazado o con errores
   * 
   * Flujo normal: pending -> verified -> paid
   * Flujo con error: pending -> failed
   */
  status: { type: String, enum: ["pending", "verified", "paid", "failed"], default: "pending" },
  
  /**
   * REFERENCIA BANCARIA O DE PAGO
   * Número de referencia proporcionado por el sistema bancario
   * 
   * Uso según método:
   * - pago_movil: Número de referencia del banco (ej: "1234567890")
   * - transfer: Número de confirmación de transferencia
   * - zelle: Email del remitente o referencia (opcional)
   * 
   * Se usa para:
   * - Verificar el pago con el banco
   * - Auditoría y conciliación bancaria
   * - Atención al cliente
   */
  reference: { type: String },         
  
  /**
   * COMPROBANTE DEL CLIENTE
   * Ruta o URL del archivo de comprobante subido por el usuario
   * 
   * Tipos de comprobante:
   * - Captura de pantalla del pago
   * - PDF del comprobante bancario
   * - Imagen del voucher
   * 
   * Características:
   * - Se almacena la ruta del archivo en el servidor
   * - Debe ser validado por un administrador
   * - Se usa como evidencia del pago realizado
   * - Formatos aceptados: JPG, PNG, PDF
   */
  customerProof: { type: String },     
}, { 
  /**
   * timestamps: true
   * - createdAt: Cuándo se creó la intención de pago
   * - updatedAt: Última modificación (cambio de estado, subida de comprobante)
   * 
   * Importante para:
   * - Tracking de tiempo de procesamiento
   * - Timeout de pagos pendientes
   * - Auditoría de transacciones
   */
  timestamps: true 
});

/**
 * MODELO MONGOOSE PARA PAYMENT INTENTS
 * 
 * Gestiona todas las intenciones de pago del sistema
 * - Nombre de colección: "paymentintents"
 * 
 * Operaciones típicas:
 * - PaymentIntent.create({ orderId, amount, currency, method }): Nuevo pago
 * - PaymentIntent.findOne({ orderId }).populate('orderId'): Pago con orden
 * - PaymentIntent.updateOne({ _id }, { status: 'verified' }): Verificar pago
 * - PaymentIntent.find({ status: 'pending' }): Pagos pendientes de verificación
 * - PaymentIntent.find({ method: 'pago_movil' }): Filtrar por método
 * 
 * Índices recomendados:
 * - orderId: Para búsquedas rápidas por orden
 * - status: Para filtros por estado
 * - createdAt: Para consultas por fecha
 */
export default mongoose.model("PaymentIntent", PaymentIntentSchema);
