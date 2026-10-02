/**
 * MODELO DE CARRITO DE COMPRAS - MONGODB/MONGOOSE
 * 
 * Este modelo representa el carrito de compras de cada usuario en la base de datos.
 * Cada usuario puede tener UN carrito activo que contiene múltiples productos
 * con sus respectivas cantidades.
 * 
 * Relaciones:
 * - Pertenece a UN usuario (relación 1:1)
 * - Contiene MÚLTIPLES productos (relación 1:N)
 * 
 * Funcionalidades que soporta:
 * - Agregar productos al carrito
 * - Actualizar cantidades de productos existentes
 * - Eliminar productos del carrito
 * - Calcular totales del carrito
 * - Persistir carrito entre sesiones
 */

import mongoose from "mongoose";

/**
 * ESQUEMA DEL CARRITO DE COMPRAS
 * Define la estructura de datos para almacenar carritos en MongoDB
 */
const cartSchema = new mongoose.Schema(
  {
    /**
     * USUARIO PROPIETARIO DEL CARRITO
     * 
     * - Referencia al modelo User mediante ObjectId
     * - Cada carrito pertenece a un único usuario
     * - Requerido: No puede existir un carrito sin usuario
     * - Permite hacer populate() para obtener datos del usuario
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * ARRAY DE PRODUCTOS EN EL CARRITO
     * 
     * Estructura anidada que contiene:
     * - product: Referencia al producto en el catálogo
     * - quantity: Cantidad seleccionada de ese producto
     * 
     * Permite múltiples productos únicos con cantidades específicas
     */
    products: [
      {
        /**
         * REFERENCIA AL PRODUCTO
         * 
         * - ObjectId que apunta al modelo Product
         * - Permite hacer populate() para obtener detalles del producto
         * - Requerido: No puede haber items sin producto asociado
         */
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        /**
         * CANTIDAD DEL PRODUCTO
         * 
         * - Número entero que indica cuántas unidades del producto
         * - Valor por defecto: 1 (cuando se agrega un producto nuevo)
         * - Requerido: Siempre debe tener una cantidad válida
         * - Se valida en el backend que sea > 0
         */
        quantity: {
          type: Number,
          required: true,
          default: 1,
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
     * Agrega automáticamente campos createdAt y updatedAt
     * - createdAt: Cuando se creó el carrito
     * - updatedAt: Última modificación del carrito
     */
    timestamps: true,
    
    /**
     * versionKey: false
     * Elimina el campo __v que Mongoose usa para control de versiones
     * No es necesario para carritos ya que se actualiza frecuentemente
     */
    versionKey: false,
  }
);

/**
 * MODELO MONGOOSE PARA CARRITOS
 * 
 * Crea el modelo "Cart" basado en el esquema definido
 * - Nombre de la colección en MongoDB: "carts" (pluralizado automáticamente)
 * - Proporciona métodos para CRUD operations
 * - Se puede usar con populate() para traer datos relacionados
 * 
 * Ejemplos de uso:
 * - Cart.findOne({ user: userId }).populate('products.product')
 * - Cart.create({ user: userId, products: [] })
 * - Cart.findByIdAndUpdate(cartId, { products: newProducts })
 */
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
