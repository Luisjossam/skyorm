import { IDatabaseConfig, IDBDriver } from "./interfaces/interfaces";
import mysql from "mysql2/promise";
import { Client as PgClient } from "pg";
import sqlite3 from "sqlite3";
import { open, Database as SQLiteDatabase } from "sqlite";
import MySqlDriver from "./adapters/MySqlAdapter";

type DBConnection = mysql.Connection | PgClient | SQLiteDatabase;

class Database {
  private static connection: any;
  static async connect(config: IDatabaseConfig) {
    switch (config.driver) {
      case "mysql":
        this.connection = new MySqlDriver({
          host: config.host,
          user: config.user,
          password: config.password,
          database: config.database,
          port: config.port ?? 3306,
        });
        await this.connection.connect();
        break;
      case "postgres":
        this.connection = new PgClient({
          host: config.host,
          user: config.user,
          password: config.password,
          database: config.database,
        });
        await this.connection.connect();
        break;
      case "sqlite":
        this.connection = await open({
          filename: config.filepath ?? ":memory:",
          driver: sqlite3.Database,
        });
        break;
      default:
        throw new Error("Unsupported database driver");
    }
  }
  static getConnection(): IDBDriver {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    return this.connection;
  }
}

export default Database;
