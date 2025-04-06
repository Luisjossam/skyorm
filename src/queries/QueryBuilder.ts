import { IRelations } from "../interfaces/interfaces";
import Model from "../model";

interface IQueryOptions {
  relations?: string[];
  conditions?: Record<string, any>;
  columns?: string[];
}
class QueryBuilder<TModel extends typeof Model> {
  private modelClass: TModel;
  private relations: IRelations[] = [];
  private conditions: Record<string, any> = {};
  private order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  constructor(modelClass: TModel) {
    this.modelClass = modelClass;
  }
  async all(columns: string[] = ["*"]) {
    return await this.modelClass.__mb_all(columns, {
      relations: this.relations,
      order_by: this.order_by,
    });
  }
  async get(columns: string[] = ["*"]) {
    return await this.modelClass.__mb_get(columns, {
      order_by: this.order_by,
      relations: this.relations,
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
  with(...relations: string[]) {
    this.relations = this.modelClass.__mb_with(...relations);
    return this;
  }
  orderBy(column: string, sort: "asc" | "desc") {
    this.order_by = {
      column: column,
      sort: sort,
    };
    return this;
  }
  where(conditions: Record<string, any>) {
    this.conditions = conditions;
    return this;
  }
}
export default QueryBuilder;
