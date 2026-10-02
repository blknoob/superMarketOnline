/**
 * ROUTER DE PAGOS - PROCESAMIENTO DE MÉTODOS DE PAGO
 * 
 * Router especializado en captura y procesamiento de diferentes métodos de pago
 * Implementa estándares OWASP para manejo seguro de archivos y transacciones
 * 
 * MÉTODOS DE PAGO SOPORTADOS:
 * - Pago Móvil (Venezuela): Con comprobante de imagen
 * - Zelle (Internacional): Transferencias en USD
 * - Webhooks de Pasarelas: Notificaciones automáticas
 * 
 * CARACTERÍSTICAS DE SEGURIDAD:
 * - Validación segura de archivos con OWASP guidelines
 * - Limite de tamaño de archivo (5MB) para comprobantes
 * - Middleware especializado para manejo de uploads
 * - Validación de tipos de archivo permitidos
 * - Rate limiting implícito para prevenir ataques
 * 
 * INTEGRACIÓN CON MULTER:
 * - Configuración segura para comprobantes de pago
 * - Validación de archivos requeridos/opcionales
 * - Manejo robusto de errores de upload
 * - Almacenamiento seguro en directorio controlado
 * 
 * MIDDLEWARES ESPECIALIZADOS:
 * - createPaymentProofUpload(): Configuración segura de multer
 * - validateFile(): Validación de archivos subidos
 * - handleMulterError(): Manejo de errores de upload
 * 
 * CONTROLADORES:
 * - PaymentsController: Funciones de procesamiento de pagos
 * 
 * BASE PATH: /payments
 * SECURITY LEVEL: Alto (procesamiento de transacciones)
 */
import { Router } from "express";
import { reportPagoMovil, reportZelle, gatewayWebhook } from "../controllers/payments.controller.js";
import { createPaymentProofUpload, validateFile, handleMulterError } from "../middlewares/upload.middleware.js";

// OWASP - Configuración segura de multer para comprobantes de pago
const upload = createPaymentProofUpload();

const router = Router();

/**
 * RUTAS DE PROCESAMIENTO DE PAGOS
 * 
 * Endpoints para captura de diferentes métodos de pago
 * Cada método tiene validaciones y requisitos específicos
 */

/**
 * REPORTAR PAGO MÓVIL
 * POST /api/payments/pagomovil/:orderId
 * 
 * Endpoint para capturar datos de transferencia Pago Móvil venezolano
 * Requiere subida de comprobante de imagen como evidencia
 * 
 * PARAMS: orderId - ObjectId de la orden a pagar
 * BODY (multipart/form-data):
 * - bank: Código del banco (0102, 0108, etc.)
 * - phone: Teléfono asociado al Pago Móvil
 * - docId: Cédula de identidad del titular
 * - reference: Número de referencia de la transferencia
 * - amount: Monto transferido en bolívares
 * - proof: Archivo de imagen del comprobante (REQUERIDO)
 * 
 * MIDDLEWARES:
 * - upload.single("proof"): Manejo seguro de archivo único
 * - validateFile(): Validación OWASP (requerido, 5MB max)
 * 
 * CONTROLLER: payments.controller.reportPagoMovil
 * RESPONSE: Redirección a página de confirmación
 * SECURITY: Validación de archivo, límites de tamaño, tipos permitidos
 */
router.post(
  "/api/payments/pagomovil/:orderId", 
  upload.single("proof"), 
  validateFile({ 
    required: true, 
    maxFileSize: 5 * 1024 * 1024 // 5MB para comprobantes
  }),
  reportPagoMovil
);

/**
 * REPORTAR PAGO ZELLE
 * POST /api/payments/zelle/:orderId
 * 
 * Endpoint para capturar datos de transferencia Zelle internacional
 * No requiere comprobante físico (sistema de referencia autogenerada)
 * 
 * PARAMS: orderId - ObjectId de la orden a pagar
 * BODY (application/json):
 * - email: Email asociado a la cuenta Zelle
 * - reference: Número de referencia de Zelle
 * - amount: Monto transferido en USD
 * 
 * MIDDLEWARE: Ninguno (datos JSON solamente)
 * CONTROLLER: payments.controller.reportZelle
 * RESPONSE: Redirección a página de confirmación
 * SECURITY: Validación de formato de email, referencia Zelle
 */
router.post("/api/payments/zelle/:orderId", reportZelle);

/**
 * WEBHOOK DE PASARELAS DE PAGO
 * POST /api/payments/webhook
 * 
 * Endpoint para recibir notificaciones automáticas de pasarelas externas
 * Procesa updates de estado de transacciones desde Stripe, PayPal, etc.
 * 
 * BODY: Payload específico de la pasarela (JSON)
 * - Estructura varía según proveedor de pago
 * - Incluye signatures y datos de verificación
 * 
 * MIDDLEWARE: Ninguno (webhook público con validación interna)
 * CONTROLLER: payments.controller.gatewayWebhook
 * RESPONSE: Status code (200/400) sin contenido
 * SECURITY: Validación de signatures, verificación de origen
 */
router.post("/api/payments/webhook", gatewayWebhook);

/**
 * MIDDLEWARE DE MANEJO DE ERRORES DE UPLOAD
 * 
 * Middleware especializado para capturar y manejar errores de multer
 * Proporciona responses apropiados para fallos de subida de archivos
 * 
 * ERRORES MANEJADOS:
 * - Archivo demasiado grande
 * - Tipo de archivo no permitido
 * - Errores de escritura en disco
 * - Corrupción de archivo
 * - Límites de campo excedidos
 * 
 * MIDDLEWARE: handleMulterError
 * APLICADO: Globalmente a todas las rutas del router
 * SECURITY: Previene exposición de detalles internos de sistema
 */
router.use(handleMulterError);

export default router;
