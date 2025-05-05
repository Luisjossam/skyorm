import { ResultSetHeader } from "mysql2";
import { IDBDriver } from "../interfaces/Interface";
import QueryBuilder from "../builders/QueryBuilder";
import ModelBase from "./ModelBase";

class UpdateModel {
  private readonly pk_value: string | number | null = null;
  private readonly conn_transaction: IDBDriver | null = null;
  private readonly result_update: ResultSetHeader;
  private readonly modelBase: typeof ModelBase;
  private readonly old_values: Record<string, any>;
  constructor(pk_value: string | number, result: ResultSetHeader, old_values: any[], conn: IDBDriver, modelBase: typeof ModelBase) {
    this.pk_value = pk_value;
    this.result_update = result;
    this.conn_transaction = conn;
    this.modelBase = modelBase;
    this.old_values = old_values;
  }
  getStatus(): boolean {
    try {
      return this.result_update.affectedRows > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async getValues(...columns: string[]): Promise<Record<string, any>> {
    return new QueryBuilder(this.modelBase).recoverValues([...columns], this.pk_value as string | number);
  }
  recoverOldValues(): Record<string, any> {
    return this.old_values;
  }
}
export default UpdateModel;
