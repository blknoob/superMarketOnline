/**
 * CONTROLADOR API DEL CARRITO - /api/carts (usuario autenticado)
 * 
 * GET    /api/carts                       Carrito con precios y totales
 * POST   /api/carts/products/:productId   Agregar { quantity }
 * PUT    /api/carts/products/:productId   Cambiar cantidad { quantity } (0 quita)
 * DELETE /api/carts/products/:productId   Quitar
 * DELETE /api/carts                       Vaciar
 */

import CartsService from "../services/carts.service.js";

const cartsService = new CartsService();

const respondWithCart = async (req, res, status = 200) => {
  res.status(status).json({ status: "success", cart: await cartsService.getCart(req.user._id) });
};

class CartController {
  async get(req, res) {
    try {
      await respondWithCart(req, res);
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async add(req, res) {
    try {
      await cartsService.addProduct(req.user._id, req.params.productId, req.body.quantity ?? 1);
      await respondWithCart(req, res);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async update(req, res) {
    try {
      await cartsService.updateQuantity(req.user._id, req.params.productId, req.body.quantity);
      await respondWithCart(req, res);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async remove(req, res) {
    try {
      await cartsService.removeProduct(req.user._id, req.params.productId);
      await respondWithCart(req, res);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async clear(req, res) {
    try {
      await cartsService.clear(req.user._id);
      await respondWithCart(req, res);
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }
}

export default CartController;
