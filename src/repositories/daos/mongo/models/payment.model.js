/**
 * MODELO DE PAGOS
 *
 * Pagos reportados por el cliente para una orden (Pago Móvil, Zelle,
 * transferencia). Un administrador los revisa y los aprueba o rechaza.
 * Una orden puede tener varios pagos (por ejemplo, si uno fue rechazado).
 *
 * Relaciones:
 * - order → orders
 * - user → users
 * - reviewedBy → users (admin que revisó)
 */

import mongoose from "mongoose";

export const PAYMENT_METHODS = ["pago_movil", "zelle", "transferencia"];
export const PAYMENT_STATUSES = ["pending", "approved", "rejected"];

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["VES", "USD", "EUR"], required: true },
    reference: { type: String, required: true, trim: true },
    // Datos de quien pagó: banco/teléfono/cédula (Pago Móvil) o email (Zelle)
    payer: {
      bank: { type: String, default: "" },
      phone: { type: String, default: "" },
      docId: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    proofUrl: { type: String, default: null },
    status: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
