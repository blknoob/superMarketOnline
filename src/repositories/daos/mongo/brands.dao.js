/**
 * DAO DE MARCAS
 */

import Brand from "./models/brand.model.js";

class BrandsDAO {
  findAll(filter = {}) {
    return Brand.find(filter).sort({ name: 1 }).lean();
  }

  findBySlug(slug) {
    return Brand.findOne({ slug }).lean();
  }

  async create(data) {
    const brand = await Brand.create(data);
    return brand.toObject();
  }
}

export default BrandsDAO;
