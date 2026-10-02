/**
 * DAO DE ÓRDENES
 */

import Order from "./models/order.model.js";

class OrdersDAO {
  async create(data, { session } = {}) {
    const [order] = await Order.create([data], { session });
    return order.toObject();
  }

  findById(id) {
    return Order.findById(id).lean();
  }

  find(filter = {}, { sort = { createdAt: -1 }, limit = 0 } = {}) {
    return Order.find(filter).sort(sort).limit(limit).populate("user", "first_name last_name email").lean();
  }

  /**
   * Cambia el estado y lo registra en el historial.
   * Si se pasa fromStatuses, solo cambia si el estado actual es uno de ellos.
   */
  updateStatus(id, status, { note = "", fromStatuses = null, session } = {}) {
    const filter = { _id: id };
    if (fromStatuses) filter.status = { $in: fromStatuses };
    return Order.findOneAndUpdate(
      filter,
      { $set: { status }, $push: { statusHistory: { status, note, at: new Date() } } },
      { new: true, session }
    ).lean();
  }
}

export default OrdersDAO;
