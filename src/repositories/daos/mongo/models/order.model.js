/**
 * MODELO DE ÓRDENES - COMPRAS DE LOS CLIENTES
 *
 * Una compra es una orden. Reemplaza a los antiguos tickets.
 *
 * La orden es una foto del momento de la compra: copia nombre, SKU,
 * precios, tasa EUR y dirección de envío. Si después cambia el
 * producto, el precio o la dirección del usuario, la orden no cambia.
 *
 * ESTADOS:
 * pending_payment → payment_review → paid → preparing → shipped → delivered
 * (cualquier estado previo a shipped puede pasar a canceled)
 *
 * Relaciones:
 * - user → users
 * - items.product → products
 * - Referenciada por payments.order
 */

import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "pending_payment",
  "payment_review",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "canceled",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    unit: { type: String },
    unitSize: { type: Number },
    image: { type: String, default: null },
    priceRef: { type: Number, required: true }, // EUR
    price: { type: Number, required: true }, // Bs, priceRef × exchangeRate
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }, // Bs
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    reference: { type: String, default: "" },
  },
  { _id: false }
);

const statusChangeSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Número legible para el cliente: ORD-20261002-4F7K
    number: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, "La orden debe tener al menos un producto"],
    },
    // Bs por cada EUR al momento de la compra
    exchangeRate: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true }, // Bs
    shippingCost: { type: Number, default: 0 }, // Bs
    total: { type: Number, required: true }, // Bs
    totalRef: { type: Number, required: true }, // EUR
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment" },
    statusHistory: { type: [statusChangeSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
