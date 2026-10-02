/**
 * REPOSITORY DE CONFIGURACIÓN
 * 
 * Capa entre los services y la persistencia. Hoy expone el DAO de
 * MongoDB tal cual; si se cambia de base de datos, se cambia aquí
 * sin tocar los services.
 */

import SettingsDAO from "./daos/mongo/settings.dao.js";

class SettingsRepository extends SettingsDAO {}

export default SettingsRepository;
