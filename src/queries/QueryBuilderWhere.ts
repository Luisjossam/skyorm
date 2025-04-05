import { IRelations } from "../interfaces/interfaces";
import ModelBase from "../model_base";

class QueryBuilderWhere {
  private readonly order_by: { column: string; sort: string } = { column: "id", sort: "asc" };
  private readonly conditions: Record<string, any> = {};
  private readonly relations: IRelations[] = [];
  constructor(
    private readonly model: typeof ModelBase,
    conditions: Record<string, any> = {},
  ) {
    this.conditions = conditions;
  }
  get(columns: string[] = ["*"]) {
    return this.model.mb_get(columns, {
      order_by: this.order_by,
      relations: this.relations,
      conditions: this.conditions,
    });
  }
}
export default QueryBuilderWhere;
