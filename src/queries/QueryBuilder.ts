import { IQueryBuilder, IQueryBuilderOrderBy, IQueryBuilderWhere, IQueryBuilderWith, IRelations } from "../interfaces/interfaces";
import ModelIntermediary from "../model_intermediary";

class QueryBuilder<TModel extends typeof ModelIntermediary> implements IQueryBuilder {
  private readonly modelClass: TModel;
  private relations: IRelations[] = [];
  private conditions: Record<string, any> = {};
  private number_limit: number | null = null;
  private order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  constructor(modelClass: TModel) {
    this.modelClass = modelClass;
  }
  async get(columns: string[] = ["*"]) {
    return await this.modelClass.__mb_get(columns, {
      order_by: this.order_by,
      relations: this.relations,
      number_limit: this.number_limit,
      conditions: this.conditions,
    });
  }
  async getOne(columns: string[] = ["*"]) {
    return await this.modelClass.__mb_getOne(columns, {
      relations: this.relations,
      conditions: this.conditions,
    });
  }
  async find(primary_key: number | string, columns: string[] = ["*"]) {
    return await this.modelClass.__mb_find(primary_key, columns, {
      relations: this.relations,
    });
  }
  async paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return await this.modelClass.__mb_paginate(current_page, per_page, columns, {
      order_by: this.order_by,
      relations: this.relations,
      conditions: this.conditions,
    });
  }
  async pluck(column: string) {
    return await this.modelClass.__mb_pluck(column, {
      order_by: this.order_by,
      conditions: this.conditions,
      number_limit: this.number_limit,
    });
  }
  async exist(): Promise<boolean> {
    return await this.modelClass.__mb_exist({ conditions: this.conditions });
  }
  async sum(column: string): Promise<number> {
    return await this.modelClass.__mb_sum(column, { conditions: this.conditions, number_limit: this.number_limit });
  }
  async count(): Promise<number> {
    return await this.modelClass.__mb_count({ conditions: this.conditions, number_limit: this.number_limit });
  }
  async min(column: string): Promise<any> {
    return await this.modelClass.__mb_min_max(column, { conditions: this.conditions, number_limit: this.number_limit }, "MIN");
  }
  async max(column: string): Promise<any> {
    return await this.modelClass.__mb_min_max(column, { conditions: this.conditions, number_limit: this.number_limit }, "MAX");
  }
  with(...relations: string[]): IQueryBuilderWith {
    this.relations = this.modelClass.__mb_with(...relations);
    return this;
  }
  limit(limit: number) {
    if (typeof limit !== "number" || isNaN(limit) || limit < 0)
      throw new TypeError(`The "limit" value must be a number and positive. Received: "${limit}"`);
    this.number_limit = limit;
    return this;
  }
  orderBy(column: string, sort: "asc" | "desc"): IQueryBuilderOrderBy {
    this.order_by = {
      column: column,
      sort: sort,
    };
    return this;
  }
  where(conditions: Record<string, any>): IQueryBuilderWhere {
    this.conditions = conditions;
    return this;
  }
}
export default QueryBuilder;
