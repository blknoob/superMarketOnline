/**
 * CONTROLADOR API DE CATEGORÍAS - /api/categories
 * 
 * GET    /api/categories       Árbol de categorías activas (público)
 * POST   /api/categories       Crear { name, parentId?, order? } (admin)
 * PUT    /api/categories/:id   Renombrar, mover, ordenar o activar (admin)
 * DELETE /api/categories/:id   Eliminar si no tiene hijas ni productos (admin)
 */

import CategoriesService from "../services/categories.service.js";

const categoriesService = new CategoriesService();

class CategoriesController {
  async tree(req, res) {
    try {
      res.json({ status: "success", categories: await categoriesService.getTree() });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  async create(req, res) {
    try {
      const category = await categoriesService.create(req.body);
      res.status(201).json({ status: "success", category });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async update(req, res) {
    try {
      const category = await categoriesService.update(req.params.id, req.body);
      res.json({ status: "success", category });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await categoriesService.delete(req.params.id);
      res.json({ status: "success", message: "Categoría eliminada" });
    } catch (error) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }
}

export default CategoriesController;
