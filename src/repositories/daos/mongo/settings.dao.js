/**
 * DAO DE CONFIGURACIÓN (clave/valor)
 */

import Setting from "./models/setting.model.js";

class SettingsDAO {
  findByKey(key) {
    return Setting.findOne({ key }).lean();
  }

  set(key, value) {
    return Setting.findOneAndUpdate({ key }, { $set: { value } }, { new: true, upsert: true }).lean();
  }
}

export default SettingsDAO;
