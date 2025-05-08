#!/usr/bin/env node
import path from "path";
import fs from "fs";
import Schema from "../Schema";
import Database from "../../database/database";
import { IDBDriver } from "../../interfaces/Interface";

const basePath = path.resolve(process.cwd(), "src/migrations");

async function runMigrations(options: string[]) {
  const files = fs.readdirSync(basePath).filter((file) => file);
  const schema = new Schema([], "", 0);
  const verify_db_config = schema.verify_database_config();
  if (!verify_db_config) {
    console.log("❌ No specified database configuration file exists or environment variables are not complete.\n");
    console.log("   Visit the documentation to learn more about database configuration and migrations.");
    process.exit(1);
  }
  schema.set_database_values();
  const database_values = schema.get_database_values();
  await Database.connect(database_values);
  const connection = Database.getConnection();
  await schema.exist_migrations_table_and_create_if_not_exist(connection);
  const new_array_files = await set_new_files_array(files, schema, connection);
  if (new_array_files.length > 0) {
    try {
      require("ts-node").register();
      const batch_number = await schema.get_last_batch(connection);
      for (const file of new_array_files) {
        const migrationPath = path.join(basePath, file);
        console.log(`🔄 Running: ${file}`);
        const migration = require(migrationPath).default;
        await migration.up(new Schema(options, file, batch_number + 1));
      }
      process.exit(0);
    } catch (error) {
      console.error("❌ Error running migrations:", error);
      process.exit(1);
    } finally {
      connection.close();
    }
  } else {
    console.log("Nothing to run.");
    connection.close();
    process.exit(0);
  }
}
async function set_new_files_array(files: string[], schema: Schema, conn: IDBDriver): Promise<string[]> {
  try {
    const new_array_files: string[] = [];
    for (const file of files) {
      const migration_execute = await schema.migration_execute(file, conn);
      if (!migration_execute) {
        new_array_files.push(file);
      }
    }
    return new_array_files;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
module.exports = runMigrations;
