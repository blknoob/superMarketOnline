/**
 * MODELO DE CONFIGURACIÓN
 *
 * Pares clave/valor editables desde el panel de administración.
 * Claves usadas: "eur_rate" (Bs por EUR) y "shipping_cost_ref" (EUR).
 */

import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
