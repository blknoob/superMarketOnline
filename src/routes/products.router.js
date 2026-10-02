/**
 * ROUTER API DE PRODUCTOS - /api/products
 * Lectura pública; escritura solo administradores.
 */

import { Router } from "express";
import ProductsController from "../controllers/products.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();
const products = new ProductsController();

router.get("/", products.list);
router.get("/:id", products.getById);
router.post("/", authenticateToken, isAdmin, products.create);
router.put("/:id", authenticateToken, isAdmin, products.update);
router.delete("/:id", authenticateToken, isAdmin, products.delete);

export default router;
