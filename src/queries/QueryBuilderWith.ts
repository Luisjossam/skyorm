import { IQueryBuilderBase, IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";
import QueryBuilderOrderBy from "./QueryBuilderOrderBy";
import QueryBuilderWhere from "./QueryBuilderWhere";

class QueryBuilderWith {
  private order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private conditions: Record<string, any> = {};
  private relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    orderBy: { column: string; sort: string } | null,
    conditions: Record<string, any> | null,
    relations: IRelations[],
  ) {
    this.relations = relations;
    if (orderBy) this.order_by = orderBy;
    if (conditions) this.conditions = conditions;
  }

  orderBy(value: string, sort: "asc" | "desc") {
    this.order_by = { column: value, sort };
    return new QueryBuilderOrderBy(this.model, value, sort, this.relations);
  }
  where(conditions: Record<string, any>) {
    return new QueryBuilderWhere(this.model, conditions, this.relations);
  }
  all(columns: string[] = ["*"]) {
    return this.model.mb_all(columns, {
      order_by: this.order_by,
      relations: this.relations,
    });
  }
  get(columns: string[] = ["*"]) {
    return this.model.mb_get(columns, {
      order_by: this.order_by,
      relations: this.relations,
      conditions: this.conditions,
    });
  }
  find(primary_key: number | string, columns: string[] = ["*"]) {
    return this.model.mb_find(primary_key, columns, {
      relations: this.relations,
    });
  }
  getOne(columns: string[] = ["*"]) {
    return this.model.mb_getOne(columns, { relations: this.relations, conditions: this.conditions });
  }
  paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return this.model.mb_paginate(current_page, per_page, columns, { order_by: this.order_by, relations: this.relations });
  }
}
export default QueryBuilderWith;
