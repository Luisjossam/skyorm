#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { IDatabaseConfig } from "../interfaces/interfaces";
import Builder from "./Builder";
dotenv.config();
class Schema {
  private filename_db_config: string = "database-config.json";
  private database_values: IDatabaseConfig = {
    driver: "mysql",
    database: "",
    host: "",
    password: "",
    user: "",
    port: 3306,
    filepath: "",
  };
  constructor(options: string[]) {
    options.forEach((i) => {
      if (i.startsWith("--config=")) {
        this.filename_db_config = i.split("=")[1];
      }
    });
  }
  async create(name_table: string, callback: (table: Builder) => void) {
    try {
      const verify_database_config = this.verify_database_config();
      if (!verify_database_config) {
        console.log(`❌ No specified database configuration file exists or environment variables are not complete.\n`);
        console.log("   Visit the documentation to learn more about database configuration and migrations.");
        process.exit(1);
      }
      this.set_database_values();
      const exist_database = await this.verify_if_exist_database();
      if (!exist_database) {
        console.error(`\n❌ There is no database, check if it exists or if you have a typo error: ${this.database_values.database}\n`);
        process.exit(1);
      }
      const exist_table = await this.verify_if_exist_table(name_table);
      if (!exist_table) {
        const builder = new Builder(name_table, this.database_values.driver);
        callback(builder);
        const sql = builder.sql();
        console.log(sql);
      } else {
      }
      console.log("✅ Migration executed correctly.");
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
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
  private verify_database_config(): boolean {
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
  private set_database_values(): void {
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
  private async verify_if_exist_table(name_table: string): Promise<boolean> {
    try {
      const { driver, filepath, database, ...rest_values_db } = this.database_values;
      switch (driver) {
        case "mysql": {
          const conn = await mysql.createConnection(rest_values_db);
          const [rows]: any[] = await conn.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [
            database,
            name_table,
          ]);
          await conn.end();
          return rows.length > 0;
        }
        default:
          throw new Error("Unsupported driver");
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
export default Schema;
