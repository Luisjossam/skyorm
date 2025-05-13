import mysql from "mysql2/promise";
import { Client as PgClient } from "pg";
import sqlite3 from "sqlite3";
import { open, Database as SQLiteDatabase } from "sqlite";
import MySqlDriver from "../adapters/MySqlAdapter";
import fs from "fs";
import { IDatabaseConfig, IDBDriver } from "../interfaces/Interface";

type DBConnection = mysql.Connection | PgClient | SQLiteDatabase;

class Database {
  private static connection: IDBDriver;
  private static driver: "mysql" | "postgres" | "sqlite";
  /**
   * Connects to a database using the provided configuration.
   *
   * You can pass a configuration object directly, or provide a path to a JSON or TXT file
   * containing the configuration. The configuration must include the required fields:
   * `driver`, `host`, `database`, `user`, and `password`. Optionally, you can provide
   * `port` (for MySQL/Postgres) or `filepath` (for SQLite).
   *
   * @param {IDatabaseConfig | string} config - The database configuration object or path to a JSON or TXT config file.
   * @returns {Promise<void>} Resolves when the connection is successfully established.
   * @throws Will throw an error if the file does not exist, the content is invalid, or the driver is not supported.
   *
   * @example
   * // Using a configuration object
   * await Database.connect({
   *   driver: "mysql",
   *   host: "localhost",
   *   database: "store",
   *   user: "root",
   *   password: "",
   *   port: 3306
   * });
   *
   * @example
   * // Using a JSON or TXT file path
   * await Database.connect("C:/.../database-config.json");
   */
  static async connect(config: IDatabaseConfig | string): Promise<void> {
    try {
      let database_info: IDatabaseConfig = config as IDatabaseConfig;
      if (typeof config === "string") {
        if (!fs.existsSync(config)) {
          throw new Error("Database configuration file does not exist");
        }
        const info: IDatabaseConfig = JSON.parse(fs.readFileSync(config, "utf-8"));
        const expectedKeys = ["driver", "host", "database", "user", "password"];
        const optionalKeys = ["port", "filepath"];
        const allValidKeys = [...expectedKeys, ...optionalKeys];
        const hasAllKeys = expectedKeys.every((key) => key in info);
        const hasOnlyValidKeys = Object.keys(info).every((key) => allValidKeys.includes(key));
        const typesAreCorrect =
          typeof info.driver === "string" &&
          typeof info.host === "string" &&
          typeof info.database === "string" &&
          typeof info.user === "string" &&
          typeof info.password === "string";
        const portIsValid = info.port === undefined || typeof info.port === "number";
        const filepathIsValid = info.filepath === undefined || typeof info.filepath === "string";
        if (hasAllKeys && hasOnlyValidKeys && typesAreCorrect && portIsValid && filepathIsValid) {
          database_info = info;
        } else {
          throw new Error("The contents of the file do not contain a valid object");
        }
      }
      this.driver = database_info.driver;
      switch (database_info.driver) {
        case "mysql":
          this.connection = new MySqlDriver({
            host: database_info.host,
            user: database_info.user,
            password: database_info.password,
            database: database_info.database,
            port: database_info.port ?? 3306,
            multipleStatements: database_info.multipleStatements ?? false,
          });
          await this.connection.connect();
          break;
        case "postgres":
          /* this.connection = new PgClient({
            host: database_info.host,
            user: database_info.user,
            password: database_info.password,
            database: database_info.database,
          });
          await this.connection.connect(); */
          break;
        case "sqlite":
          /*  this.connection = await open({
            filename: database_info.filepath ?? ":memory:",
            driver: sqlite3.Database,
          }); */
          break;
        default:
          throw new Error("Unsupported database driver");
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  static getConnection(): IDBDriver {
    if (!this.connection) {
      throw new Error("Database not connected");
    }
    return this.connection;
  }
  static rollback() {
    switch (this.driver) {
      case "mysql":
        return this.connection.rollback();
      default:
        break;
    }
  }
  static beginTransaction() {
    switch (this.driver) {
      case "mysql":
        return this.connection.beginTransaction();

      default:
        break;
    }
  }
  static commit() {
    switch (this.driver) {
      case "mysql":
        return this.connection.commit();

      default:
        break;
    }
  }
  static close() {
    switch (this.driver) {
      case "mysql":
        return this.connection.close();
      default:
        break;
    }
  }
}

export default Database;
