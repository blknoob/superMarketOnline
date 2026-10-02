/**
 * SERVICIO DE PAGOS
 *
 * Flujo de pago manual:
 * 1. El cliente reporta el pago (Pago Móvil, Zelle o transferencia)
 *    → la orden pasa a "Pago en revisión"
 * 2. Un administrador lo revisa:
 *    - Aprobado → la orden pasa a "Pagada"
 *    - Rechazado → la orden vuelve a "Pendiente de pago" y el cliente
 *      puede reportar otro pago
 */

import PaymentsRepository from "../repositories/payments.repository.js";
import OrdersService from "./orders.service.js";
import { PAYMENT_METHODS } from "../repositories/daos/mongo/models/payment.model.js";

// Moneda en que se reporta cada método
const METHOD_CURRENCY = {
  pago_movil: "VES",
  transferencia: "VES",
  zelle: "USD",
};

export const METHOD_LABELS = {
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
  zelle: "Zelle",
};

class PaymentsService {
  constructor() {
    this.repository = new PaymentsRepository();
    this.ordersService = new OrdersService();
  }

  /**
   * El cliente reporta un pago para su orden.
   */
  async report(userId, orderId, { method, amount, reference, bank, phone, docId, email, proofUrl }) {
    const order = await this.ordersService.getForUserById(userId, orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (order.status !== "pending_payment") {
      throw new Error("Esta orden no está esperando un pago");
    }
    if (!PAYMENT_METHODS.includes(method)) throw new Error("Método de pago inválido");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw new Error("El monto debe ser mayor a 0");
    if (!reference || !reference.trim()) throw new Error("La referencia del pago es obligatoria");

    const payment = await this.repository.create({
      order: order._id,
      user: userId,
      method,
      amount: value,
      currency: METHOD_CURRENCY[method],
      reference: reference.trim(),
      payer: { bank, phone, docId, email },
      proofUrl: proofUrl || null,
    });
    await this.ordersService.changeStatus(order._id, "payment_review", `Pago reportado (${METHOD_LABELS[method]})`);
    return payment;
  }

  getForOrder(orderId) {
    return this.repository.findByOrder(orderId);
  }

  list({ status } = {}) {
    return this.repository.find(status ? { status } : {});
  }

  /**
   * El administrador aprueba o rechaza un pago pendiente.
   */
  async review(paymentId, adminId, approve) {
    const payment = await this.repository.review(paymentId, {
      status: approve ? "approved" : "rejected",
      reviewedBy: adminId,
    });
    if (!payment) throw new Error("Pago no encontrado o ya revisado");

    const order = await this.ordersService.getById(payment.order);
    if (order && order.status === "payment_review") {
      await this.ordersService.changeStatus(
        order._id,
        approve ? "paid" : "pending_payment",
        approve ? "Pago aprobado" : "Pago rechazado"
      );
    }
    return payment;
  }
}

export default PaymentsService;
