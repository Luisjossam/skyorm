import Database from "../database/database";
import { IDBDriver } from "../interfaces/Interface";
import ModelBase from "./ModelBase";

class Transaction {
  static async new<T>(callback: (t: IDBDriver) => Promise<T>): Promise<T> {
    const connection = Database.getConnection();
    try {
      await connection.beginTransaction();
      ModelBase.setTransactionConn(connection);
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.close();
    }
  }
}
export default Transaction;
