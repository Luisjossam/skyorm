import { IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";
import QueryBuilderWith from "./QueryBuilderWith";

class QueryBuilderWhere {
  private readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private readonly conditions: Record<string, any> = {};
  private relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    conditions: Record<string, any>,
    relations: IRelations[],
  ) {
    this.relations = relations;
    this.conditions = conditions;
  }
  with(...relations: string[]) {
    this.relations = this.model.mb_with(...relations);
    return new QueryBuilderWith(this.model, this.order_by, this.conditions, this.relations);
  }
  get(columns: string[] = ["*"]) {
    return this.model.mb_get(columns, {
      order_by: this.order_by,
      relations: this.relations,
      conditions: this.conditions,
    });
  }
  getOne(columns: string[] = ["*"]) {
    return this.model.mb_getOne(columns, { relations: this.relations, conditions: this.conditions });
  }
}
export default QueryBuilderWhere;
