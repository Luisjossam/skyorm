import { IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";
import QueryBuilderWhere from "./QueryBuilderWhere";
import QueryBuilderWith from "./QueryBuilderWith";

class QueryBuilderOrderBy {
  private readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    column: string,
    sort: "asc" | "desc",
    relations: IRelations[],
  ) {
    this.order_by = { column, sort };
    this.relations = relations;
  }
  with(...relations: string[]) {
    this.relations = this.model.mb_with(...relations);
    return new QueryBuilderWith(this.model, this.order_by, null, this.relations);
  }
  where(conditions: Record<string, any>) {
    return new QueryBuilderWhere(this.model, conditions, this.relations);
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
