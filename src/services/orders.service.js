/**
 * SERVICIO DE ÓRDENES
 *
 * CREAR ORDEN (checkout):
 * Dentro de una transacción de MongoDB descuenta el stock de cada
 * producto, crea la orden con precios y tasa del momento y vacía el
 * carrito. Si algo falla (por ejemplo, otro cliente se llevó el último
 * producto), no se aplica ninguno de los cambios.
 *
 * ESTADOS:
 * pending_payment → payment_review → paid → preparing → shipped → delivered
 * Cancelar devuelve el stock (no se puede después de enviada).
 */

import crypto from "crypto";
import mongoose from "mongoose";
import OrdersRepository from "../repositories/orders.repository.js";
import ProductsRepository from "../repositories/products.repository.js";
import CartsRepository from "../repositories/carts.repository.js";
import SettingsService from "./settings.service.js";
import { round2, toBs } from "../utils/money.js";

// Estados a los que se puede pasar desde cada estado
const TRANSITIONS = {
  pending_payment: ["payment_review", "canceled"],
  payment_review: ["paid", "pending_payment", "canceled"],
  paid: ["preparing", "canceled"],
  preparing: ["shipped", "canceled"],
  shipped: ["delivered"],
  delivered: [],
  canceled: [],
};

export const STATUS_LABELS = {
  pending_payment: "Pendiente de pago",
  payment_review: "Pago en revisión",
  paid: "Pagada",
  preparing: "En preparación",
  shipped: "Enviada",
  delivered: "Entregada",
  canceled: "Cancelada",
};

class OrdersService {
  constructor() {
    this.repository = new OrdersRepository();
    this.productsRepository = new ProductsRepository();
    this.cartsRepository = new CartsRepository();
    this.settingsService = new SettingsService();
  }

  /**
   * Crea una orden con el carrito del usuario.
   *
   * @param {string} userId
   * @param {Object} shippingAddress - Dirección elegida (se copia a la orden)
   */
  async createFromCart(userId, shippingAddress) {
    const exchangeRate = await this.settingsService.getExchangeRate();
    if (!exchangeRate) throw new Error("La tienda todavía no configuró la tasa EUR; intenta más tarde");
    const shippingCostRef = await this.settingsService.getShippingCostRef();

    const session = await mongoose.startSession();
    try {
      let order;
      await session.withTransaction(async () => {
        const cart = await this.cartsRepository.findByUser(userId);
        const cartItems = (cart?.items || []).filter((i) => i.product);
        if (cartItems.length === 0) throw new Error("Tu carrito está vacío");

        const items = [];
        for (const { product, quantity } of cartItems) {
          if (!product.isActive) throw new Error(`${product.name} ya no está disponible`);
          const updated = await this.productsRepository.decrementStock(product._id, quantity, { session });
          if (!updated) throw new Error(`No hay stock suficiente de ${product.name}`);

          const price = toBs(product.priceRef, exchangeRate);
          items.push({
            product: product._id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            unitSize: product.unitSize,
            image: product.images?.[0] || null,
            priceRef: product.priceRef,
            price,
            quantity,
            subtotal: round2(price * quantity),
          });
        }

        const subtotal = round2(items.reduce((sum, i) => sum + i.subtotal, 0));
        const shippingCost = toBs(shippingCostRef, exchangeRate);
        const subtotalRef = items.reduce((sum, i) => sum + i.priceRef * i.quantity, 0);

        order = await this.repository.create(
          {
            number: orderNumber(),
            user: userId,
            items,
            exchangeRate,
            subtotal,
            shippingCost,
            total: round2(subtotal + shippingCost),
            totalRef: round2(subtotalRef + shippingCostRef),
            shippingAddress: pickAddress(shippingAddress),
            status: "pending_payment",
            statusHistory: [{ status: "pending_payment" }],
          },
          { session }
        );
        await this.cartsRepository.clear(userId, { session });
      });
      return order;
    } finally {
      await session.endSession();
    }
  }

  getForUser(userId) {
    return this.repository.find({ user: userId });
  }

  /**
   * Orden del usuario; null si no existe o es de otra persona.
   */
  async getForUserById(userId, orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
    const order = await this.repository.findById(orderId);
    if (!order || String(order.user) !== String(userId)) return null;
    return order;
  }

  getById(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
    return this.repository.findById(orderId);
  }

  list({ status } = {}) {
    return this.repository.find(status ? { status } : {});
  }

  /**
   * Cambia el estado validando la transición. Cancelar devuelve el stock.
   */
  async changeStatus(orderId, status, note = "") {
    const order = await this.getById(orderId);
    if (!order) throw new Error("Orden no encontrada");
    if (!TRANSITIONS[order.status].includes(status)) {
      throw new Error(`No se puede pasar de "${STATUS_LABELS[order.status]}" a "${STATUS_LABELS[status] || status}"`);
    }

    if (status !== "canceled") {
      const updated = await this.repository.updateStatus(orderId, status, { note, fromStatuses: [order.status] });
      if (!updated) throw new Error("La orden cambió mientras se actualizaba; vuelve a intentar");
      return updated;
    }

    const session = await mongoose.startSession();
    try {
      let updated;
      await session.withTransaction(async () => {
        updated = await this.repository.updateStatus(orderId, "canceled", {
          note,
          fromStatuses: [order.status],
          session,
        });
        if (!updated) throw new Error("La orden cambió mientras se actualizaba; vuelve a intentar");
        for (const item of order.items) {
          await this.productsRepository.incrementStock(item.product, item.quantity, { session });
        }
      });
      return updated;
    } finally {
      await session.endSession();
    }
  }

  allowedTransitions(status) {
    return TRANSITIONS[status] || [];
  }
}

// ORD-20261002-4F7KQ
const orderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(4).toString("hex").slice(0, 5).toUpperCase();
  return `ORD-${date}-${random}`;
};

const pickAddress = (address = {}) => ({
  recipient: address.recipient,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2 || "",
  city: address.city,
  state: address.state,
  reference: address.reference || "",
});

export default OrdersService;
