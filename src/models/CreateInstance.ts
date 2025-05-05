import QueryBuilder from "../builders/QueryBuilder";
import { IDBDriver } from "../interfaces/Interface";
import ModelBase from "./ModelBase";
import UpdateModel from "./UpdateModel";

class CreateModel {
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
  async update(data: Record<string, any>): Promise<UpdateModel> {
    return new QueryBuilder(this.modelBase).update(this.pk_value as string | number, data, this.connection_transaction);
  }
  async delete(): Promise<{ status: boolean; message: string }> {
    return new QueryBuilder(this.modelBase)._delete(this.connection_transaction, this.pk_value);
  }
  async restore(): Promise<boolean> {
    return new QueryBuilder(this.modelBase)._restore(this.connection_transaction, this.pk_value);
  }
  async softDelete(): Promise<{ status: boolean; message: string }> {
    return new QueryBuilder(this.modelBase)._softDelete(this.connection_transaction, this.pk_value);
  }
  async getValues(...columns: string[]): Promise<Record<string, any>> {
    return new QueryBuilder(this.modelBase).recoverValues([...columns], this.pk_value as string | number);
  }
}
export default CreateModel;
