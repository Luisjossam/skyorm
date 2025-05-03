import Database from "../database/database";
import { IDBDriver } from "../interfaces/interfaces";
import ModelBase from "./ModelBase";

class Transaction {
  static async new(callback: (t: IDBDriver) => Promise<void>) {
    const connection = Database.getConnection();
    try {
      await connection.beginTransaction();
      ModelBase.setTransactionConn(connection);
      await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.close();
    }
  }
}
export default Transaction;
