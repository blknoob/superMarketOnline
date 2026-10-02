import SystemConfig from "../repositories/daos/mongo/models/systemConfig.model.js";

class SystemConfigService {
  /**
   * Obtener valor de configuración
   * @param {string} key - Clave de configuración
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {Promise<*>} Valor de configuración
   */
  async getConfig(key, defaultValue = null) {
    try {
      const config = await SystemConfig.findOne({ key });
      return config ? config.value : defaultValue;
    } catch (error) {
      console.error(`Error obteniendo configuración ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Establecer valor de configuración
   * @param {string} key - Clave de configuración
   * @param {*} value - Valor a almacenar
   * @returns {Promise<boolean>} True si se guardó correctamente
   */
  async setConfig(key, value) {
    try {
      await SystemConfig.findOneAndUpdate(
        { key },
        { 
          key,
          value,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error(`Error guardando configuración ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtener la última cotización EUR utilizada
   * @returns {Promise<number>} Valor de cotización EUR
   */
  async getLastEurRate() {
    return await this.getConfig('last_eur_rate', 2.0000);
  }

  /**
   * Guardar la última cotización EUR utilizada
   * @param {number} rate - Cotización EUR
   * @returns {Promise<boolean>} True si se guardó
   */
  async setLastEurRate(rate) {
    return await this.setConfig('last_eur_rate', parseFloat(rate));
  }

  /**
   * Obtener información completa de la última actualización EUR
   * @returns {Promise<Object>} Información de la última actualización
   */
  async getLastEurRateInfo() {
    try {
      const config = await SystemConfig.findOne({ key: 'last_eur_rate' });
      if (config) {
        return {
          rate: config.value,
          updatedAt: config.updatedAt,
          isDefault: false
        };
      } else {
        return {
          rate: 2.0000,
          updatedAt: null,
          isDefault: true
        };
      }
    } catch (error) {
      console.error('Error obteniendo información EUR:', error);
      return {
        rate: 2.0000,
        updatedAt: null,
        isDefault: true
      };
    }
  }
}

export default SystemConfigService;