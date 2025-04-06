import ModelBase from "./model_base";
import QueryBuilder from "./queries/QueryBuilder";
import QueryBuilderOrderBy from "./queries/QueryBuilderOrderBy";
import QueryBuilderWhere from "./queries/QueryBuilderWhere";
import QueryBuilderWith from "./queries/QueryBuilderWith";

class Model extends ModelBase {
  constructor(table: string) {
    super(table);
  }
  private static readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  static with(...relations: string[]) {
    return new QueryBuilder(this).with(...relations);
  }
  static orderBy(column: string, sort: "asc" | "desc") {
    return new QueryBuilder(this).orderBy(column, sort);
  }
  static where(conditions: Record<string, any>) {
    return new QueryBuilder(this).where(conditions);
  }
  static all(columns: string[] = ["*"]) {
    return this.__mb_all(columns, { order_by: this.order_by });
  }
  static getOne(columns: string[] = ["*"]) {
    return this.__mb_getOne(columns, {});
  }
  static find(primary_key: number | string, columns: string[] = ["*"]) {
    return this.__mb_find(primary_key, columns, {});
  }
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return this.__mb_paginate(current_page, per_page, columns, { order_by: this.order_by });
  }
  static valuesOf(column: string) {
    return this.__mb_valuesOf(column, { order_by: this.order_by });
  }
}
export default Model;
