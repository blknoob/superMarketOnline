/**
 * MODELO DE TICKETS - COMPROBANTES DE COMPRA
 * 
 * Este modelo representa los tickets o facturas generados cuando se completa una compra.
 * Cada ticket es un registro inmutable de una transacción realizada, conteniendo
 * todos los detalles necesarios para facturación, inventario y auditoría.
 * 
 * Características principales:
 * - Comprobante de compra con código único
 * - Registro detallado de productos, cantidades y precios
 * - Información del comprador para comunicación
 * - Cálculo total de la transacción
 * - Registro temporal para auditoría
 * 
 * Flujo de creación:
 * 1. Usuario procede al checkout
 * 2. Se valida stock de productos
 * 3. Se genera ticket con productos disponibles
 * 4. Se actualiza stock de productos
 * 5. Se vacía el carrito del usuario
 * 6. Se envía comprobante al email del comprador
 * 
 * Relaciones:
 * - Referencia productos del catálogo (tickets.products.product)
 * - Asociado a un usuario comprador (por email)
 */

import mongoose from "mongoose";

/**
 * ESQUEMA DE TICKETS/COMPROBANTES
 * Define la estructura completa de un ticket de compra
 */
const ticketSchema = new mongoose.Schema(
  {
    /**
     * CÓDIGO ÚNICO DEL TICKET
     * Identificador alfanumérico único para el comprobante
     * - Único en el sistema (unique: true)
     * - Se genera automáticamente al crear el ticket
     * - Formato típico: "TKT-" + timestamp + random
     * - Se muestra al cliente y se usa para búsquedas
     * - Ej: "TKT-20240102-ABC123"
     */
    code: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * MONTO TOTAL DE LA COMPRA
     * Suma total de todos los productos en el ticket
     * - Calculado como suma de (precio * cantidad) de cada producto
     * - Se usa para reportes financieros y contabilidad
     * - Moneda del sistema (generalmente USD o moneda local)
     */
    amount: {
      type: Number,
      required: true,
    },

    /**
     * EMAIL DEL COMPRADOR
     * Identificación del usuario que realizó la compra
     * - Se almacena como string (email) en lugar de ObjectId
     * - Permite envío directo de comprobantes por email
     * - Útil para consultas de historial de compras
     * - Se mantiene como string para flexibilidad
     */
    purchaser: {
      type: String,
      required: true,
    },

    /**
     * ARRAY DE PRODUCTOS COMPRADOS
     * Detalle completo de cada producto incluido en la compra
     * 
     * Estructura de cada item:
     * - product: Referencia al producto en el catálogo
     * - quantity: Cantidad comprada de ese producto
     * - price: Precio unitario al momento de la compra (histórico)
     */
    products: [
      {
        /**
         * REFERENCIA AL PRODUCTO
         * ObjectId que apunta al producto en el catálogo
         * - Permite hacer populate() para obtener detalles completos
         * - Mantiene relación con el catálogo actual
         * - Útil para análisis de productos más vendidos
         */
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        /**
         * CANTIDAD COMPRADA
         * Número de unidades de este producto en la compra
         * - Debe ser mayor a 0
         * - Se usa para calcular el subtotal (quantity * price)
         * - Se descuenta del stock del producto al generar el ticket
         */
        quantity: {
          type: Number,
          required: true,
        },

        /**
         * PRECIO HISTÓRICO
         * Precio unitario del producto AL MOMENTO de la compra
         * - IMPORTANTE: Precio fijo, no cambia si el producto se actualiza
         * - Mantiene integridad histórica de la transacción
         * - Se usa para cálculos de subtotales y total
         * - Permite auditoría de precios en el tiempo
         */
        price: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    /**
     * CONFIGURACIONES DEL ESQUEMA
     */
    
    /**
     * timestamps: true
     * Registro automático de timestamps:
     * - createdAt: Fecha y hora exacta de la compra (IMPORTANTE para auditoría)
     * - updatedAt: Última modificación (normalmente no debería cambiar)
     * 
     * El createdAt es especialmente importante porque:
     * - Define el momento exacto de la transacción
     * - Se usa en reportes de ventas por período
     * - Necesario para auditorías fiscales
     */
    timestamps: true,
    
    /**
     * versionKey: false
     * Los tickets son documentos inmutables, no requieren control de versiones
     */
    versionKey: false,
  }
);

/**
 * MODELO MONGOOSE PARA TICKETS
 * 
 * Maneja todos los comprobantes de compra del sistema
 * - Nombre de colección: "tickets"
 * - Índices automáticos: _id, code (unique), createdAt
 * 
 * Operaciones típicas:
 * - Ticket.create({ code, amount, purchaser, products }): Generar nuevo ticket
 * - Ticket.find({ purchaser: email }): Historial de compras de un usuario
 * - Ticket.findOne({ code }): Buscar ticket por código
 * - Ticket.find({ createdAt: { $gte: startDate } }): Reportes de ventas
 * - Ticket.populate('products.product'): Incluir detalles de productos
 * 
 * Consideraciones importantes:
 * - Los tickets SON INMUTABLES una vez creados
 * - Mantienen precios históricos para integridad
 * - Se usan para reportes de ventas e inventario
 * - Requeridos para cumplimiento fiscal
 */
const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
