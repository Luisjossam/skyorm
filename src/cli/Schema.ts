#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { IDatabaseConfig, IDBDriver } from "../interfaces/Interface";
import Builder from "./Builder";
import Database from "../database/database";
dotenv.config();
class Schema {
  private filename_db_config: string = "database-config.json";
  private filename: string = "";
  private batch_number: number = 0;
  private database_values: IDatabaseConfig = {
    driver: "mysql",
    database: "",
    host: "",
    password: "",
    user: "",
    port: 3306,
    filepath: "",
  };
  constructor(options: string[], filename: string, batch_number: number) {
    options.forEach((i) => {
      if (i.startsWith("--config=")) {
        this.filename_db_config = i.split("=")[1];
      }
    });
    this.filename = filename;
    this.batch_number = batch_number;
  }
  async create(name_table: string, callback: (table: Builder) => void) {
    try {
      this.set_database_values();
      await Database.connect(this.database_values);
      const connection = Database.getConnection();
      try {
        const exist_database = await this.verify_if_exist_database();
        if (!exist_database) {
          throw new Error(`❌ Database not found: ${this.database_values.database}`);
        }
        const exist_table = await this.verify_if_exist_table(name_table, connection);
        if (!exist_table) {
          const builder = new Builder(name_table, this.database_values.driver);
          callback(builder);
          const sql = builder.sql();
          await connection.query(sql, []);
        } else {
        }
        await this.register_migration(this.filename, connection);
        console.log("✅ Migration executed correctly.");
      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        connection.close();
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async drop(name_table: string) {}
  private verify_env(): boolean {
    try {
      const variables = ["SKYORM_DRIVER", "SKYORM_HOST", "SKYORM_DATABASE", "SKYORM_USER", "SKYORM_PORT"];
      for (const variable of variables) {
        if (!process.env[variable]) return false;
        if (process.env.SKYORM_DRIVER === "sqlite") {
          if (!process.env.SKYORM_FILEPATH) return false;
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
  get_database_values() {
    return this.database_values;
  }
  verify_database_config(): boolean {
    try {
      const exist_env = this.verify_env();
      if (!exist_env) {
        return !!fs.existsSync(path.join(process.cwd(), this.filename_db_config));
      } else {
        return true;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  set_database_values(): void {
    try {
      if (this.verify_env()) {
        this.database_values = {
          driver: process.env.SKYORM_DRIVER as any,
          database: process.env.SKYORM_DATABASE as string,
          host: process.env.SKYORM_HOST as string,
          password: process.env.SKYORM_PASSWORD ?? "",
          user: process.env.SKYORM_USER as string,
          port: process.env.SKYORM_PORT as unknown as number,
          filepath: process.env.SKYORM_FILEPATH ?? "",
        };
      } else {
        const data: IDatabaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.filename_db_config), "utf-8"));
        this.database_values = {
          driver: data.driver,
          database: data.database,
          host: data.host,
          password: data.password,
          user: data.user,
          filepath: data.filepath,
          port: data.port,
        };
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async verify_if_exist_database(): Promise<boolean> {
    try {
      const { driver, filepath, database, ...rest_values_db } = this.database_values;
      switch (driver) {
        case "mysql": {
          const conn = await mysql.createConnection(rest_values_db);
          const [rows]: any[] = await conn.execute(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [database]);
          await conn.end();

          return rows.length > 0;
        }

        default:
          return false;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async verify_if_exist_table(name_table: string, conn: IDBDriver): Promise<boolean> {
    try {
      const [result] = await conn.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [
        this.database_values.database,
        name_table,
      ]);
      return result.length > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async exist_migrations_table_and_create_if_not_exist(conn: IDBDriver): Promise<void> {
    try {
      const result = await this.verify_if_exist_table("migrations", conn);
      if (!result) {
        switch (this.database_values.driver) {
          case "mysql":
            await conn.query(`CREATE TABLE migrations (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              batch INT NOT NULL,
              migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );`);
            break;
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  private async register_migration(filename: string, conn: IDBDriver): Promise<void> {
    try {
      await conn.query(`INSERT INTO migrations (name, batch)VALUES(?,?)`, [filename, this.batch_number]);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async migration_execute(filename: string, conn: IDBDriver): Promise<boolean> {
    try {
      const [result] = await conn.query("SELECT id FROM migrations WHERE name = ?", [filename]);
      return result.length > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async get_last_batch(conn: IDBDriver): Promise<number> {
    try {
      const [get_last_batch] = await conn.query("SELECT batch FROM migrations ORDER BY batch DESC LIMIT 1");
      let batch_number = 1;
      if (get_last_batch.length > 0) {
        batch_number = parseInt(get_last_batch.batch) + 1;
      }
      return batch_number;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
export default Schema;
