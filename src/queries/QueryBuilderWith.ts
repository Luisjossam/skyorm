import { IQueryBuilderBase, IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";

class QueryBuilderWith implements IQueryBuilderBase {
  private order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    orderBy: { column: string; sort: string } | null,
    ...relations: string[]
  ) {
    this.with(...relations);
    if (orderBy) {
      this.order_by = orderBy;
    }
  }

  private with(...relations: string[]) {
    this.relations = [];
    relations.forEach((relationName) => {
      const relationMethod = this.model[relationName];
      if (typeof relationMethod === "function") {
        const relation = relationMethod.call(this.model);
        this.relations.push(relation);
      }
    });
  }
  orderBy(value: string, sort: "asc" | "desc"): this {
    this.order_by = { column: value, sort };
    return this;
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
    });
  }
  find(primary_key: number | string, columns: string[] = ["*"]) {
    return this.model.mb_find(primary_key, columns, {
      relations: this.relations,
    });
  }
  getOne(columns: string[] = ["*"]) {
    return this.model.mb_getOne(columns, { relations: this.relations });
  }
  paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return this.model.mb_paginate(current_page, per_page, columns, { order_by: this.order_by, relations: this.relations });
  }
}
export default QueryBuilderWith;
