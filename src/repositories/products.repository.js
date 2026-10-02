/**
 * REPOSITORY DE PRODUCTOS
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import ProductsDAO from "./daos/mongo/products.dao.js";

class ProductsRepository extends ProductsDAO {}

export default ProductsRepository;
