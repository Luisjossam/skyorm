import ModelBase from "./model_base";
import QueryBuilderOrderBy from "./queries/QueryBuilderOrderBy";
import QueryBuilderWith from "./queries/QueryBuilderWith";

class Model extends ModelBase {
  static readonly table: string;
  private static readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  /**
   * Eager loads the specified relations for the model instance.
   * This method allows you to specify relationships to include in the query results by appending them to the `selectedRelations` array.
   * It creates a new instance of the model, copies the current selected relations, and then adds the requested relations.
   *
   * Each relation name corresponds to a method that defines the relationship on the model.
   * If the method exists, it is called, and the relation is added to the `selectedRelations` array.
   *
   * @param {...string} relations - The names of the relations to be eagerly loaded. Each relation name should correspond to a method on the model.
   *
   * @returns {Model} A new instance of the model with the specified relations loaded.
   *
   * @example
   * class ProductModel extends Model {
   *   category() {
   *     return this.belongsTo(CategoryModel);
   *   }
   * }
   *
   * const product = ProductModel.with('category').findById(1);
   * // The product will include the 'category' relation in the result.
   */
  static with(...relations: string[]) {
    return new QueryBuilderWith(this, null, ...relations);
  }
  static orderBy(column: string, sort: "asc" | "desc") {
    return new QueryBuilderOrderBy(this, column, sort);
  }
  static all(columns: string[] = ["*"]) {
    return super.mb_all(columns, { order_by: this.order_by });
  }
  static find(primary_key: number | string, columns: string[] = ["*"]) {
    return super.mb_find(primary_key, columns, {});
  }
  static getOne(columns: string[] = ["*"]) {
    return super.mb_getOne(columns, {});
  }
  static valuesOf(column: string) {
    return super.mb_valuesOf(column, { order_by: this.order_by });
  }
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return super.mb_paginate(current_page, per_page, columns, { order_by: this.order_by });
  }
}
export default Model;
