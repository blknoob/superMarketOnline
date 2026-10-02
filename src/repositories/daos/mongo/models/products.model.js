/**
 * MODELO DE PRODUCTOS - CATÁLOGO DEL SUPERMERCADO
 * 
 * Este modelo representa todos los productos disponibles en el supermercado.
 * Incluye información del producto, precios, stock y categorización jerárquica.
 * 
 * Características principales:
 * - Categorización en dos niveles (principal y subcategoría)
 * - Control de inventario (stock)
 * - Código único por producto
 * - Imagen opcional para mostrar en la tienda
 * - Compatibilidad con sistema de categorías antiguo
 * 
 * Relaciones:
 * - Referenciado por carritos (carts.products.product)
 * - Referenciado por tickets (tickets.products.product)
 * - Referenciado por órdenes (orders.products.product)
 */

import mongoose from "mongoose";

/**
 * ESQUEMA DE PRODUCTOS
 * Define la estructura completa de un producto en el catálogo
 */
const productSchema = new mongoose.Schema(
  {
    /**
     * TÍTULO DEL PRODUCTO
     * Nombre principal que se muestra al cliente
     * Ej: "Leche Entera Parmalat 1L", "Jabón Protex Antibacterial"
     */
    title: {
      type: String,
      required: true,
    },

    /**
     * DESCRIPCIÓN DETALLADA
     * Información adicional del producto, ingredientes, características
     * Se muestra en la vista de detalle del producto
     */
    description: {
      type: String,
      required: true,
    },

    /**
     * CÓDIGO ÚNICO DEL PRODUCTO
     * Identificador alfanumérico único (SKU)
     * - Único en toda la base de datos (unique: true)
     * - Se usa para búsquedas rápidas y referencias internas
     * - Ej: "LAC001", "JAB045", "ARZ123"
     */
    code: {
      type: String,
      required: true,
      unique: true,
    },

    /**
     * PRECIO DEL PRODUCTO
     * Precio unitario en la moneda del sistema
     * - Número decimal para manejar centavos
     * - Se usa para cálculos de totales en carrito y tickets
     */
    price: {
      type: Number,
      required: true,
    },

    /**
     * PRECIO DE REFERENCIA BASE (EUR)
     * Precio base fijo en euros que no cambia
     * - Se usa para calcular el precio final con cotización
     * - No se modifica en actualizaciones automáticas
     */
    ref: {
      type: Number,
      default: function() { return this.price; } // Por defecto igual al price inicial
    },

    /**
     * STOCK DISPONIBLE
     * Cantidad de unidades disponibles en inventario
     * - Se reduce al realizar ventas
     * - Se usa para controlar disponibilidad
     * - Previene sobreventa
     */
    stock: {
      type: Number,
      required: true,
    },

    /**
     * CATEGORÍA PRINCIPAL
     * Primer nivel de categorización del producto
     * - Valores predefinidos para mantener consistencia
     * - Se usa para filtros y navegación del catálogo
     * - Estructura jerárquica para mejor organización
     */
    mainCategory: {
      type: String,
      required: true,
      enum: ['Alimentación', 'Limpieza', 'Higiene Personal', 'Bebidas', 'Hogar', 'Bebés y Niños'],
    },

    /**
     * SUBCATEGORÍA
     * Segundo nivel de categorización, más específico
     * - Permite clasificación detallada dentro de la categoría principal
     * - Ej: En "Alimentación" -> "Lácteos", "Carnes", "Cereales"
     */
    subCategory: {
      type: String,
      required: true,
    },

    /**
     * CATEGORÍA (LEGACY)
     * Campo mantenido para compatibilidad con versiones anteriores
     * - No requerido (required: false)
     * - Se usará mainCategory + subCategory en su lugar
     * - Se mantiene para evitar breaking changes
     */
    category: {
      type: String,
      required: false,
    },

    /**
     * IMAGEN DEL PRODUCTO
     * URL o path de la imagen principal del producto
     * - Opcional (default: null)
     * - Se muestra en tarjetas de producto y página de detalle
     * - Si es null, se puede mostrar imagen placeholder
     */
    image: {
      type: String,
      default: null,
    },
  },
  {
    /**
     * CONFIGURACIONES DEL ESQUEMA
     */
    
    /**
     * timestamps: true
     * Añade automáticamente:
     * - createdAt: Fecha de creación del producto
     * - updatedAt: Última modificación (precio, stock, descripción, etc.)
     */
    timestamps: true,
    
    /**
     * versionKey: false
     * Elimina el campo __v de control de versiones
     * Simplifica la estructura del documento
     */
    versionKey: false,
  }
);

/**
 * MODELO MONGOOSE PARA PRODUCTOS
 * 
 * Proporciona interface para operaciones CRUD en el catálogo
 * - Nombre de colección: "products"
 * - Índices automáticos: _id, code (unique)
 * 
 * Casos de uso comunes:
 * - Product.find({ mainCategory: 'Alimentación' })
 * - Product.findOne({ code: 'LAC001' })
 * - Product.updateOne({ _id }, { $inc: { stock: -quantity } })
 * - Product.find({ stock: { $gt: 0 } }) // Productos con stock
 */
const Product = mongoose.model("Product", productSchema);

export default Product;
