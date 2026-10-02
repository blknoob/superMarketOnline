/**
 * DAO DE PAGOS
 */

import Payment from "./models/payment.model.js";

class PaymentsDAO {
  async create(data) {
    const payment = await Payment.create(data);
    return payment.toObject();
  }

  findById(id) {
    return Payment.findById(id).lean();
  }

  findByOrder(orderId) {
    return Payment.find({ order: orderId }).sort({ createdAt: -1 }).lean();
  }

  find(filter = {}) {
    return Payment.find(filter)
      .sort({ createdAt: -1 })
      .populate("order", "number total status")
      .populate("user", "first_name last_name email")
      .lean();
  }

  // Solo actualiza pagos que siguen pendientes, para no revisar dos veces
  review(id, { status, reviewedBy }) {
    return Payment.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status, reviewedBy, reviewedAt: new Date() } },
      { new: true }
    ).lean();
  }
}

export default PaymentsDAO;
