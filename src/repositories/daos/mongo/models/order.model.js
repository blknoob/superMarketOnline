/**
 * MODELO DE ÓRDENES DE COMPRA
 * 
 * Este modelo representa las órdenes generadas antes del pago final.
 * Es el paso intermedio entre el carrito y el ticket final de compra.
 * Permite manejar el proceso de pago de manera controlada y segura.
 * 
 * Flujo de vida de una orden:
 * 1. Se crea cuando el usuario procede al checkout
 * 2. Estado inicial: "pending_payment"
 * 3. Se genera PaymentIntent asociado
 * 4. Usuario realiza el pago
 * 5. Estado cambia a "paid" tras verificar pago
 * 6. Se genera Ticket final
 * 7. Se actualiza stock de productos
 * 
 * Características principales:
 * - Snapshot de productos con precios al momento de creación
 * - Estados para controlar el flujo de pago
 * - Relación con usuario y productos
 * - Cálculos de subtotales y total
 * 
 * Relaciones:
 * - Pertenece a UN usuario (orders.user)
 * - Referencia productos del catálogo (orders.items.product)
 * - Referenciada por PaymentIntent (paymentIntent.orderId)
 */

import mongoose from "mongoose";

/**
 * ESQUEMA ANIDADO PARA ITEMS DE LA ORDEN
 * Define la estructura de cada producto dentro de una orden
 */
const OrderItemSchema = new mongoose.Schema({
  /**
   * REFERENCIA AL PRODUCTO
   * ObjectId que apunta al producto en el catálogo
   * Permite obtener información actualizada del producto si es necesario
   */
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  
  /**
   * SNAPSHOT DEL TÍTULO
   * Nombre del producto AL MOMENTO de crear la orden
   * - Copia fija que no cambiará aunque se actualice el producto
   * - Garantiza consistencia en la orden
   * - Se muestra en confirmaciones y emails
   */
  title:   { type: String, required: true },   
  
  /**
   * SNAPSHOT DEL PRECIO
   * Precio unitario del producto AL MOMENTO de crear la orden
   * - Precio fijo que no cambiará aunque se actualice el producto
   * - Fundamental para mantener la integridad de la transacción
   * - Se usa para cálculos de subtotal y total
   */
  price:   { type: Number, required: true },   
  
  /**
   * CANTIDAD SOLICITADA
   * Número de unidades de este producto en la orden
   * - Mínimo 1 unidad (min: 1)
   * - Se valida contra stock disponible al crear la orden
   * - Se usará para descontar stock cuando se confirme el pago
   */
  quantity:{ type: Number, required: true, min: 1 },
  
  /**
   * SUBTOTAL CALCULADO
   * Resultado de price * quantity para este item
   * - Precalculado para evitar errores de redondeo
   * - Se suma para obtener el total de la orden
   * - Facilita auditoría y verificación de cálculos
   */
  subtotal:{ type: Number, required: true },
}, { 
  /**
   * _id: false
   * Los items no necesitan _id propio, son parte de la orden
   * Simplifica la estructura del documento
   */
  _id: false 
});

/**
 * ESQUEMA PRINCIPAL DE ORDENES
 * Define la estructura completa de una orden de compra
 */
const OrderSchema = new mongoose.Schema({
  /**
   * USUARIO PROPIETARIO DE LA ORDEN
   * ObjectId que referencia al usuario que creó la orden
   * - Una orden siempre pertenece a un usuario específico
   * - Se usa para filtrar órdenes por usuario
   * - Permite hacer populate() para obtener datos del usuario
   */
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  /**
   * ARRAY DE PRODUCTOS EN LA ORDEN
   * Lista de todos los items incluidos en la orden
   * - Cada item incluye producto, precio, cantidad y subtotal
   * - Array vacío por defecto (no debería ocurrir en uso normal)
   * - Usa el esquema OrderItemSchema definido arriba
   */
  items:  { type: [OrderItemSchema], default: [] },
  
  /**
   * TOTAL DE LA ORDEN
   * Suma de todos los subtotales de los items
   * - Monto que debe pagar el usuario
   * - Se copia al PaymentIntent
   * - Se verifica contra la suma de subtotales para consistencia
   */
  total:  { type: Number, required: true },
  
  /**
   * ESTADO DE LA ORDEN
   * Controla el flujo del proceso de compra
   * 
   * Estados posibles:
   * - "pending_payment": Orden creada, esperando pago
   * - "paid": Pago verificado y confirmado
   * - "canceled": Orden cancelada (timeout, error, etc.)
   * 
   * Flujo normal: pending_payment -> paid
   * Flujo con error: pending_payment -> canceled
   */
  status: { type: String, enum: ["pending_payment","paid","canceled"], default: "pending_payment" },
}, { 
  /**
   * timestamps: true
   * - createdAt: Cuándo se creó la orden (inicio del proceso de pago)
   * - updatedAt: Última modificación (cambio de estado, generalmente)
   */
  timestamps: true 
});

/**
 * MODELO MONGOOSE PARA ÓRDENES
 * 
 * Maneja las órdenes en proceso de pago
 * - Nombre de colección: "orders"
 * - Previene conflictos si ya existe el modelo
 * 
 * Operaciones típicas:
 * - Order.create({ user, items, total }): Crear nueva orden
 * - Order.findById(orderId).populate('user items.product'): Orden completa
 * - Order.updateOne({ _id }, { status: 'paid' }): Confirmar pago
 * - Order.find({ user: userId, status: 'paid' }): Órdenes pagadas del usuario
 * - Order.find({ status: 'pending_payment', createdAt: { $lt: timeout } }): Órdenes expiradas
 */
export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
