/**
 * SERVICIO DE CATEGORÍAS - ÁRBOL DEL CATÁLOGO
 *
 * Mantiene la consistencia del árbol:
 * - Al crear, calcula slug y ancestros
 * - Al renombrar o mover, recalcula los ancestros de toda la rama y el
 *   categoryPath de sus productos
 * - No permite borrar categorías con subcategorías o productos
 *
 * El árbol se guarda en memoria porque el menú lo usa en cada página;
 * se invalida en cada cambio.
 */

import CategoriesRepository from "../repositories/categories.repository.js";
import ProductsRepository from "../repositories/products.repository.js";
import { slugify } from "../utils/slugify.js";

// Árbol inicial para una base de datos nueva
const DEFAULT_TREE = {
  "Alimentación": ["Lácteos", "Carnes y Pollo", "Frutas", "Verduras", "Panadería", "Huevos", "Despensa", "Congelados"],
  "Bebidas": ["Gaseosas", "Jugos", "Agua", "Bebidas Alcohólicas", "Café e Infusiones"],
  "Limpieza": ["Detergentes", "Desinfectantes", "Papel Higiénico y Servilletas", "Accesorios de Limpieza"],
  "Higiene Personal": ["Cuidado Personal", "Cuidado del Cabello", "Cuidado Oral", "Perfumería"],
  "Hogar": ["Utensilios", "Decoración", "Jardinería", "Electrodomésticos"],
  "Bebés y Niños": ["Pañales", "Alimentos Infantiles", "Cuidado del Bebé", "Juguetes"],
};

let treeCache = null;

class CategoriesService {
  constructor() {
    this.repository = new CategoriesRepository();
    this.productsRepository = new ProductsRepository();
  }

  invalidateCache() {
    treeCache = null;
  }

  /**
   * Árbol anidado de categorías activas: [{ _id, name, slug, children: [...] }]
   */
  async getTree() {
    if (treeCache) return treeCache;
    const categories = await this.repository.findAll({ isActive: true });
    treeCache = buildTree(categories);
    return treeCache;
  }

  /**
   * Lista plana en orden de árbol, con profundidad, para los <select>.
   * Incluye categorías inactivas (el administrador las necesita ver).
   */
  async getFlatList() {
    const categories = await this.repository.findAll();
    const flat = [];
    const walk = (nodes, depth) => {
      for (const node of nodes) {
        flat.push({ ...node, depth, label: `${"— ".repeat(depth)}${node.name}`, children: undefined });
        walk(node.children, depth + 1);
      }
    };
    walk(buildTree(categories), 0);
    return flat;
  }

  getById(id) {
    return this.repository.findById(id);
  }

  getBySlug(slug) {
    return this.repository.findBySlug(slug);
  }

  async create({ name, parentId = null, order = 0 }) {
    if (!name || !name.trim()) throw new Error("El nombre de la categoría es obligatorio");

    const parent = parentId ? await this.repository.findById(parentId) : null;
    if (parentId && !parent) throw new Error("La categoría padre no existe");

    const category = await this.repository.create({
      name: name.trim(),
      slug: await this.uniqueSlug(name, parent),
      parent: parent ? parent._id : null,
      ancestors: parent ? ancestorsOf(parent) : [],
      order: Number(order) || 0,
    });
    this.invalidateCache();
    return category;
  }

  async update(id, { name, parentId, order, isActive }) {
    const category = await this.repository.findById(id);
    if (!category) throw new Error("Categoría no encontrada");

    const changes = {};
    if (name !== undefined && name.trim() && name.trim() !== category.name) changes.name = name.trim();
    if (order !== undefined) changes.order = Number(order) || 0;
    if (isActive !== undefined) changes.isActive = Boolean(isActive);

    const newParentId = parentId === undefined ? undefined : parentId || null;
    const parentChanged =
      newParentId !== undefined && String(newParentId || "") !== String(category.parent || "");

    if (parentChanged) {
      if (newParentId) {
        if (String(newParentId) === String(id)) throw new Error("Una categoría no puede ser su propia madre");
        const descendants = await this.repository.findDescendants(id);
        if (descendants.some((d) => String(d._id) === String(newParentId))) {
          throw new Error("No se puede mover una categoría dentro de una de sus subcategorías");
        }
      }
      const parent = newParentId ? await this.repository.findById(newParentId) : null;
      if (newParentId && !parent) throw new Error("La categoría padre no existe");
      changes.parent = parent ? parent._id : null;
      changes.ancestors = parent ? ancestorsOf(parent) : [];
    }

    const updated = await this.repository.update(id, changes);
    if (changes.name || parentChanged) await this.rebuildBranch(updated);
    this.invalidateCache();
    return updated;
  }

  async delete(id) {
    const category = await this.repository.findById(id);
    if (!category) throw new Error("Categoría no encontrada");
    if (await this.repository.countChildren(id)) {
      throw new Error("La categoría tiene subcategorías; muévelas o bórralas primero");
    }
    if (await this.productsRepository.count({ category: id })) {
      throw new Error("La categoría tiene productos; muévelos a otra categoría primero");
    }
    await this.repository.delete(id);
    this.invalidateCache();
    return category;
  }

  /**
   * IDs de la categoría y todas sus descendientes.
   */
  async getBranchIds(id) {
    const descendants = await this.repository.findDescendants(id);
    return [id, ...descendants.map((d) => d._id)];
  }

  /**
   * Crea el árbol inicial si la colección está vacía.
   * @returns {Promise<number>} cantidad de categorías creadas
   */
  async seedDefaults() {
    if (await this.repository.count()) return 0;
    let created = 0;
    let order = 0;
    for (const [rootName, children] of Object.entries(DEFAULT_TREE)) {
      const root = await this.create({ name: rootName, order: order++ });
      created++;
      for (const [i, childName] of children.entries()) {
        await this.create({ name: childName, parentId: root._id, order: i });
        created++;
      }
    }
    return created;
  }

  /**
   * Recalcula ancestros de las descendientes de una categoría y el
   * categoryPath de los productos de toda la rama.
   */
  async rebuildBranch(category) {
    const descendants = await this.repository.findDescendants(category._id);
    const byId = new Map([[String(category._id), category]]);
    // Ordenadas por profundidad: cada padre se procesa antes que sus hijas
    descendants.sort((a, b) => a.ancestors.length - b.ancestors.length);
    for (const node of descendants) {
      const parent = byId.get(String(node.parent));
      const updated = await this.repository.update(node._id, { ancestors: ancestorsOf(parent) });
      byId.set(String(node._id), updated);
    }
    for (const node of byId.values()) {
      const path = [...node.ancestors.map((a) => a._id), node._id];
      await this.productsRepository.updateMany({ category: node._id }, { $set: { categoryPath: path } });
    }
  }

  async uniqueSlug(name, parent) {
    const base = slugify(name);
    const candidates = [base, parent ? `${parent.slug}-${base}` : null].filter(Boolean);
    for (const slug of candidates) {
      if (!(await this.repository.findBySlug(slug))) return slug;
    }
    for (let n = 2; ; n++) {
      const slug = `${candidates[candidates.length - 1]}-${n}`;
      if (!(await this.repository.findBySlug(slug))) return slug;
    }
  }
}

const ancestorsOf = (parent) => [
  ...parent.ancestors,
  { _id: parent._id, name: parent.name, slug: parent.slug },
];

const buildTree = (categories) => {
  const nodes = new Map(categories.map((c) => [String(c._id), { ...c, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parent && nodes.get(String(node.parent));
    if (parent) parent.children.push(node);
    else if (!node.parent) roots.push(node);
  }
  return roots;
};

export default CategoriesService;
