import { IModelMethods, IPaginateData, IQueryBuilderLimit } from "./interfaces/interfaces";
import ModelBase from "./model_base";
import QueryBuilder from "./queries/QueryBuilder";

type ModelConstructor = {
  new (...args: any[]): ModelBase;
} & IModelMethods;
class Model extends ModelBase {
  constructor(table: string) {
    super(table);
  }
  private static readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  static with(...relations: string[]) {
    return new QueryBuilder(this).with(...relations);
  }
  static limit(limit: number): IQueryBuilderLimit {
    return new QueryBuilder(this).limit(limit);
  }
  static orderBy(column: string, sort: "asc" | "desc") {
    return new QueryBuilder(this).orderBy(column, sort);
  }
  static where(conditions: Record<string, any>) {
    return new QueryBuilder(this).where(conditions);
  }
  static get(columns: string[] = ["*"]): Promise<any[]> {
    return this.__mb_get(columns, { order_by: this.order_by });
  }
  static getOne(columns: string[] = ["*"]): Promise<Record<string, any> | null> {
    return this.__mb_getOne(columns, {});
  }
  static find(primary_key: number | string, columns: string[] = ["*"]): Promise<Record<string, any> | null> {
    return this.__mb_find(primary_key, columns, {});
  }
  static paginate(current_page: number, per_page: number, columns: string[] = ["*"]): Promise<IPaginateData> {
    return this.__mb_paginate(current_page, per_page, columns, { order_by: this.order_by });
  }
  static pluck(column: string): Promise<string[] | number[]> {
    return this.__mb_pluck(column, { order_by: this.order_by });
  }
  static sum(column: string): Promise<number> {
    return this.__mb_sum(column, {});
  }
  static raw(query: string, values: (string | number | boolean)[], as_model: boolean = true) {
    return this.__mb_raw(query, values, as_model);
  }
  static count() {
    return this.__mb_count({});
  }
}
export default Model as unknown as ModelConstructor;
