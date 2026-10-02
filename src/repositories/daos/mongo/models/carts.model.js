/**
 * MODELO DE CARRITOS
 *
 * Un carrito por usuario. Solo guarda referencias a productos y
 * cantidades: precios y stock se leen del producto al mostrarlo,
 * y se congelan recién al crear la orden.
 *
 * Relaciones:
 * - user → users (uno a uno)
 * - items.product → products
 */

import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
