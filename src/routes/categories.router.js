/**
 * ROUTER API DE CATEGORÍAS - /api/categories
 * Lectura pública; escritura solo administradores.
 */

import { Router } from "express";
import CategoriesController from "../controllers/categories.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const categories = new CategoriesController();

router.get("/", categories.tree);
router.post("/", authenticateToken, isAdmin, categories.create);
router.put("/:id", authenticateToken, isAdmin, categories.update);
router.delete("/:id", authenticateToken, isAdmin, categories.delete);

export default router;
