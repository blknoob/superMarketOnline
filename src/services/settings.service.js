/**
 * SERVICIO DE CONFIGURACIÓN
 *
 * Valores que el administrador cambia desde el panel:
 * - eur_rate: cuántos Bs vale 1 EUR (base de todos los precios en Bs)
 * - shipping_cost_ref: costo de envío en EUR
 */

import SettingsRepository from "../repositories/settings.repository.js";

const EUR_RATE = "eur_rate";
const SHIPPING_COST_REF = "shipping_cost_ref";

class SettingsService {
  constructor() {
    this.repository = new SettingsRepository();
  }

  /**
   * Tasa EUR vigente, o null si el administrador todavía no la configuró.
   */
  async getExchangeRate() {
    const setting = await this.repository.findByKey(EUR_RATE);
    return setting ? Number(setting.value) : null;
  }

  async getExchangeRateInfo() {
    const setting = await this.repository.findByKey(EUR_RATE);
    return {
      rate: setting ? Number(setting.value) : null,
      updatedAt: setting ? setting.updatedAt : null,
    };
  }

  async setExchangeRate(rate) {
    const value = Number(rate);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("La tasa EUR debe ser un número mayor a 0");
    }
    return this.repository.set(EUR_RATE, value);
  }

  async getShippingCostRef() {
    const setting = await this.repository.findByKey(SHIPPING_COST_REF);
    return setting ? Number(setting.value) : 0;
  }

  async setShippingCostRef(cost) {
    const value = Number(cost);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("El costo de envío debe ser un número mayor o igual a 0");
    }
    return this.repository.set(SHIPPING_COST_REF, value);
  }
}

export default SettingsService;
