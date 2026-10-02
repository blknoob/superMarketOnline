/**
 * CONTROLADOR API DE ÓRDENES - /api/orders (usuario autenticado)
 * 
 * GET  /api/orders       Mis pedidos
 * GET  /api/orders/:id   Detalle de un pedido propio
 * POST /api/orders       Crear pedido con el carrito
 *                        { addressId } o { address: { recipient, phone, line1, city, state, ... } }
 */

import OrdersService from "../services/orders.service.js";
import UsersService from "../services/users.service.js";

const ordersService = new OrdersService();
const usersService = new UsersService();

class OrdersController {
  async list(req, res) {
    try {
      res.json({ status: "success", orders: await ordersService.getForUser(req.user._id) });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async getById(req, res) {
    try {
      const order = await ordersService.getForUserById(req.user._id, req.params.id);
      if (!order) return res.status(404).json({ status: "error", message: "Pedido no encontrado" });
      res.json({ status: "success", order });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async create(req, res) {
    try {
      const { addressId, address: newAddress } = req.body;
      const address = addressId
        ? await usersService.getAddress(req.user._id, addressId)
        : await usersService.addAddress(req.user._id, newAddress || {});
      if (!address) throw new Error("Dirección no encontrada");
      const order = await ordersService.createFromCart(req.user._id, address);
      res.status(201).json({ status: "success", order });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }
}

export default OrdersController;
