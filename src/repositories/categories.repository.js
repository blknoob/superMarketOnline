/**
 * REPOSITORY DE CATEGORÍAS
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import CategoriesDAO from "./daos/mongo/categories.dao.js";

class CategoriesRepository extends CategoriesDAO {}

export default CategoriesRepository;
