import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2";
import { IDBConnection, IDBDriver } from "../interfaces/interfaces";

class MySqlDriver implements IDBDriver {
  private connection: mysql.Connection | null = null;
  private readonly host: string = "localhost";
  private readonly user: string;
  private readonly password: string;
  private readonly database: string;
  private readonly port: number | undefined;

  constructor(options: IDBConnection) {
    this.host = options.host ?? "localhost";
    this.user = options.user;
    this.password = options.password;
    this.database = options.database;
    this.port = options.port ?? 3306;
  }
  getConnection() {
    return this.connection;
  }
  async connect() {
    this.connection = await mysql.createConnection({
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.database,
      port: this.port,
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<any> {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    const rows = await this.connection.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
  async beginTransaction(): Promise<void> {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    await this.connection.beginTransaction();
  }
  async commit(): Promise<void> {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    await this.connection.commit();
  }
  async rollback(): Promise<void> {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    await this.connection.rollback();
  }
}
export default MySqlDriver;
