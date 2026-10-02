/**
 * DAO DE ÓRDENES DE COMPRA
 * 
 * Data Access Object para gestionar órdenes en el proceso de checkout
 * Las órdenes son el estado intermedio entre el carrito y el ticket final
 * 
 * Flujo de vida de una orden:
 * 1. Usuario procede al checkout → Orden creada (status: "pending_payment")
 * 2. Se genera PaymentIntent asociado a la orden  
 * 3. Usuario realiza pago → PaymentIntent actualizado
 * 4. Se verifica pago → Orden marcada como "paid"
 * 5. Se genera Ticket final → Proceso completado
 * 
 * Funcionalidades principales:
 * - Creación de órdenes desde carrito
 * - Control de estados del proceso de pago
 * - Búsqueda y actualización de órdenes
 * - Interface optimizada con .lean() para rendimiento
 * 
 * Estados posibles:
 * - "pending_payment": Esperando pago del usuario
 * - "paid": Pago confirmado y verificado
 * - "canceled": Orden cancelada (timeout, error, etc.)
 * 
 * Características técnicas:
 * - Uso de .lean() para mejor rendimiento (objetos JS planos)
 * - Snapshots de productos con precios al momento de creación
 * - Relación con PaymentIntent para gestión de pagos
 */

import Order from "./models/order.model.js";

/**
 * CLASE DAO PARA ÓRDENES
 * Implementa operaciones de persistencia del proceso de checkout
 */
export default class OrdersDAO {

  /**
   * CREAR NUEVA ORDEN
   * 
   * Genera una nueva orden desde el carrito del usuario
   * Función crítica del proceso de checkout
   * 
   * Proceso típico:
   * 1. Se valida carrito del usuario
   * 2. Se verifica stock de productos
   * 3. Se crean snapshots de productos y precios
   * 4. Se calcula total de la orden
   * 5. Se crea orden con este método
   * 6. Se genera PaymentIntent asociado
   * 
   * @param {Object} data - Datos completos de la orden
   * @param {ObjectId} data.user - ID del usuario que realiza la compra
   * @param {Array} data.items - Array de productos con snapshots
   * @param {Array} data.items[].product - ID del producto
   * @param {string} data.items[].title - Nombre del producto (snapshot)
   * @param {number} data.items[].price - Precio unitario (snapshot)
   * @param {number} data.items[].quantity - Cantidad solicitada
   * @param {number} data.items[].subtotal - Precio * cantidad
   * @param {number} data.total - Suma total de todos los subtotales
   * @param {string} [data.status="pending_payment"] - Estado inicial
   * @returns {Promise<Object>} Orden creada con _id generado
   * @throws {Error} Si hay errores de validación o datos inválidos
   */
  create(data) {
    return Order.create(data); // Crea una orden
  }

  /**
   * BUSCAR ORDEN POR ID
   * 
   * Obtiene una orden específica usando su ObjectId
   * Usa .lean() para mejor rendimiento (no necesita métodos Mongoose)
   * 
   * Usos comunes:
   * - Verificar estado de orden antes de procesar pago
   * - Obtener detalles para mostrar al usuario
   * - Validar orden al recibir confirmación de pago
   * 
   * @param {string|ObjectId} id - ID de la orden a buscar
   * @returns {Promise<Object|null>} Orden encontrada (objeto JS plano) o null
   * @throws {Error} Si el ID es inválido
   */
  getById(id) {
    return Order.findById(id).lean(); // Busca por ID
  }

  /**
   * MARCAR ORDEN COMO PAGADA
   * 
   * Método específico para confirmar pago exitoso
   * Se ejecuta cuando se verifica el pago del usuario
   * 
   * Proceso típico:
   * 1. PaymentIntent cambia a "paid"
   * 2. Se llama este método para actualizar la orden
   * 3. Se genera Ticket final
   * 4. Se actualiza stock de productos
   * 5. Se limpia carrito del usuario
   * 
   * @param {string|ObjectId} id - ID de la orden a marcar como pagada
   * @returns {Promise<Object|null>} Orden actualizada con status "paid" o null
   * @throws {Error} Si la orden no existe o hay errores de DB
   */
  markPaid(id) {
    return Order.findByIdAndUpdate(id, { status: "paid" }, { new: true }).lean();
  }

  /**
   * ACTUALIZAR ESTADO DE ORDEN
   * 
   * Método genérico para cambiar el estado de una orden
   * Permite transiciones entre todos los estados posibles
   * 
   * Estados válidos:
   * - "pending_payment": Esperando pago
   * - "paid": Pago confirmado
   * - "canceled": Orden cancelada
   * 
   * Usos comunes:
   * - Cancelar orden por timeout
   * - Marcar como pagada (también se puede usar markPaid)
   * - Revertir estado en caso de error
   * 
   * @param {string|ObjectId} id - ID de la orden a actualizar
   * @param {string} status - Nuevo estado de la orden
   * @returns {Promise<Object|null>} Orden actualizada con nuevo estado o null
   * @throws {Error} Si la orden no existe o estado inválido
   */
  updateStatus(id, status) {
    return Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }
}
