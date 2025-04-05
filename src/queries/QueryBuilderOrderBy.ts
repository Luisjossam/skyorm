import { IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";
import QueryBuilderWith from "./QueryBuilderWith";

class QueryBuilderOrderBy {
  private readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private readonly relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    column: string,
    sort: "asc" | "desc",
  ) {
    this.order_by = { column, sort };
  }
  with(...relations: string[]) {
    return new QueryBuilderWith(this.model, this.order_by, ...relations);
  }
  all(columns: string[] = ["*"]) {
    console.log(this.relations);

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
  valuesOf(column: string) {
    return this.model.mb_valuesOf(column, { order_by: this.order_by });
  }
  paginate(current_page: number, per_page: number, columns: string[] = ["*"]) {
    return this.model.mb_paginate(current_page, per_page, columns, { order_by: this.order_by, relations: this.relations });
  }
}
export default QueryBuilderOrderBy;
