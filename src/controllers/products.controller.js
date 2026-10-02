/**
 * CONTROLADOR API DE PRODUCTOS - /api/products
 * 
 * GET    /api/products?category=slug&q=texto&page=1  Catálogo público
 * GET    /api/products/:id                            Detalle
 * POST   /api/products                                Crear (admin)
 * PUT    /api/products/:id                            Editar (admin)
 * DELETE /api/products/:id                            Eliminar (admin)
 */

import mongoose from "mongoose";
import ProductsService from "../services/products.service.js";

const productsService = new ProductsService();

class ProductsController {
  async list(req, res) {
    try {
      const { category, q, page } = req.query;
      const result = await productsService.list({ categorySlug: category, search: q, page });
      res.json({ status: "success", ...result });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async getById(req, res) {
    try {
      const product = mongoose.Types.ObjectId.isValid(req.params.id)
        ? await productsService.getById(req.params.id)
        : null;
      if (!product || !product.isActive) {
        return res.status(404).json({ status: "error", message: "Producto no encontrado" });
      }
      res.json({ status: "success", product });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async create(req, res) {
    try {
      const product = await productsService.create(req.body);
      res.status(201).json({ status: "success", product });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async update(req, res) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      res.json({ status: "success", product });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await productsService.delete(req.params.id);
      res.json({ status: "success", message: "Producto eliminado" });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }
}

export default ProductsController;
