import QueryBuilder from "../builders/QueryBuilder";
import { IDBDriver } from "../interfaces/interfaces";
import ModelBase from "./ModelBase";

class CreateInstance {
  private readonly pk_value: string | number | null = null;
  private readonly modelBase: typeof ModelBase;
  private readonly connection_transaction: IDBDriver;
  constructor(model_base: typeof ModelBase, pk_value: string | number | null, conn: IDBDriver) {
    this.modelBase = model_base;
    this.pk_value = pk_value;
    this.connection_transaction = conn;
  }
  pkValue(): string | number | null {
    return this.pk_value;
  }
  reload() {
    return new QueryBuilder(this.modelBase).find(this.pkValue() as string | number);
  }
  async update(data: Record<string, any>): Promise<boolean> {
    return new QueryBuilder(this.modelBase).update(this.pk_value as string | number, data, this.connection_transaction);
  }
}
export default CreateInstance;
