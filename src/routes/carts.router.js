/**
 * ROUTER API DEL CARRITO - /api/carts
 * Opera siempre sobre el carrito del usuario autenticado.
 */

import { Router } from "express";
import CartController from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();
const cart = new CartController();

router.use(authenticate);
router.get("/", cart.get);
router.delete("/", cart.clear);
router.post("/products/:productId", cart.add);
router.put("/products/:productId", cart.update);
router.delete("/products/:productId", cart.remove);

export default router;
