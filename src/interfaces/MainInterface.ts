import CreateInstance from "../models/CreateInstance";
import ModelClass from "../models/Model";
import {
  ModelFind,
  ModelGet,
  ModelSum as MS,
  ModelWhere as MW,
  ModelMin as MMin,
  ModelCount as MC,
  ModelAvg as MA,
  ModelMax as MMax,
  ModelOrderBy as MOB,
  ModelWith as MWith,
  ModelLimit as ML,
  ModelOrWhere as MOW,
  ModelGetOne as MGO,
  ModelHaving as MH,
  ModelGroupBy as MGB,
  ModelPluck as MP,
  ModelPaginate as MPag,
  ModelExist as ME,
  ModelDelete as MD,
} from "./Interface";

export interface Model extends MW, ModelGet, ModelFind, MWith, MMin, ML, MP, MPag {
  /**
   * Defines a "belongs to" relationship between the current model and another model.
   * This method establishes a relationship where the current model has a foreign key that points to another model's primary key.
   * The foreign key can be customized, otherwise, it defaults to the name of the related table with `_id` appended.
   *
   * @param {typeof Model} model - The related model class that this model belongs to.
   * @param {string[]} columns - The columns to be selected in the query.
   * @param {string} [foreign_key] - The name of the foreign key column in the current model's table. If not provided, it will be inferred based on the related model's table name.
   *
   * @returns {Object} An object describing the related table, foreign key, and the primary key of the related model.
   *
   * @example
   * class ProductModel extends Model {
   *   static category() {
   *     return this.belongsTo(CategoryModel, ['id', 'name']);
   *   }
   * }
   *
   */
  belongsTo(model: typeof ModelClass, columns: string[], foreign_key?: string): any;
  hasMany(model: typeof ModelClass, columns: string[], foreign_key?: string): any;
  hasOne(model: typeof ModelClass, columns: string[], foreign_key?: string): any;
  belongsToMany(model: typeof ModelClass, columns: string[], pivotTable?: string, foreignKey?: string, relatedKey?: string): any;

  /**
   * Executes a raw SQL query and returns the result either as model instances or as plain JSON objects.
   *
   * @param {string} query The raw SQL query to execute.
   * @param {Array<string | number>} values The values to bind to the query parameters.
   * @param {boolean} [as_model=true] If `true`, the result will be returned as instances of the model; if `false`, it will return a plain JSON object. Defaults to `true`.
   * @returns {Promise<Array<ModelType> | any[]>} An array of model instances if `as_model` is `true`, or a plain JSON array if `as_model` is `false`.
   * @throws {Error} Throws an error if the query fails.
   *
   * @example
   * // Example usage:
   * const table = "products";
   * const products = await ProductModel.raw(`SELECT * FROM ${table} WHERE price > ? LIMIT ?`, [20, 2]);
   * console.log(products); // Output will be an array of Product model instances.
   *
   * // Example with plain JSON response:
   * const plainProducts = await ProductModel.raw(`SELECT * FROM ${table} WHERE price > ? LIMIT ?`, [20, 2], false);
   * console.log(plainProducts); // Output will be a plain JSON array.
   */
  raw(query: string, values: (string | number | boolean)[], as_model?: boolean): Promise<any[]>;
  create(data: Record<string, any>): Promise<CreateInstance>;
  update(pk: string | number, data: Record<string, any>): Promise<any>;
}
export interface ModelWhere extends MW, ModelGet, MS, MMin, MC, MA, MMax, MOB, MWith, MOW, MGO, MH, MGB, MP, MPag, ME, MD {}
export interface ModelSum extends MS, ModelGet, MMin, MC, MA, MW, MMax, MOB, MH, MGB {}
export interface ModelMin extends MMin, ModelGet, MC, MA, MW, MMax, MOB, MH, MGB {}
export interface ModelCount extends MC, ModelGet, MA, MS, MMin, MW, MMax, MOB, MH, MGB {}
export interface ModelAvg extends MA, MC, ModelGet, MS, MMin, MW, MMax, MOB, MH, MGB {}
export interface ModelMax extends MMax, MA, MC, ModelGet, MS, MMin, MW, MOB, MH, MGB {}
export interface ModelOrderBy extends MW, ModelGet, MS, MMin, MC, MA, MMax, MWith, ML, MGO, MH, MGB, MP, MPag {}
export interface ModelWith extends MWith, ModelGet, MW, MOB, ML, MGO, MGB, MPag {}
export interface ModelLimit extends MWith, ModelGet, MW, MOB, MGB, MP {}
export interface ModelOrWhere extends ModelGet, MS, MMax, MMin, MC, MA, MOB, MWith, MGO, MGB, MP, MPag, MD {}
export interface ModelHaving extends MH, MOB, MW, MS, MMin, MMax, MGB {}
