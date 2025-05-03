import QueryBuilder from "../builders/QueryBuilder";
import ModelBase from "./ModelBase";

class CreateInstance {
  private readonly pk_value: string | number | null = null;
  private readonly modelBase: typeof ModelBase;
  constructor(model_base: typeof ModelBase, pk_value: string | number | null) {
    this.modelBase = model_base;
    this.pk_value = pk_value;
  }
  pkValue(): string | number | null {
    return this.pk_value;
  }
  reload() {
    return new QueryBuilder(this.modelBase).find(this.pkValue() as string | number);
  }
}
export default CreateInstance;
