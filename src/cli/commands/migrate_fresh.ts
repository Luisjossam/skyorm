import path from "path";
import Database from "../../database/database";
import Schema from "../Schema";
import BuilderSQL from "../BuilderSQL";
const basePath = path.resolve(process.cwd(), "src/migrations");
async function migrate_fresh(options: string[]) {
  const schema = new Schema([], "", 0);
  const verify_db_config = schema.verify_database_config();
  if (!verify_db_config) {
    console.log("❌ No specified database configuration file exists or environment variables are not complete.\n");
    console.log("   Visit the documentation to learn more about database configuration and migrations.");
    process.exit(1);
  }
  schema.set_database_values();
  const database_values = schema.get_database_values();
  await Database.connect({
    ...database_values,
    multipleStatements: true,
  });
  const connection = Database.getConnection();
  try {
    const migrations = await schema.get_all_migrations(connection);
    require("ts-node").register();
    const builderSQL = new BuilderSQL();
    const sql_tables = builderSQL.dropAllTables(migrations);
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    for (const table of sql_tables) {
      await connection.query(`DROP TABLE IF EXISTS ${table};`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
    await schema.exist_migrations_table_and_create_if_not_exist(connection);
    const batch_number = await schema.get_last_batch(connection);
    for (const migration of [...migrations].reverse()) {
      const migrationPath = path.join(basePath, migration.name);
      console.log(`🔄 Running: ${migration.name}`);
      const migration_up = require(migrationPath).default;
      await migration_up.up(new Schema(options, migration.name, batch_number + 1));
    }
    console.log("✅ Fresh completed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fresh failed:", error);
    process.exit(1);
  } finally {
    connection.close();
  }
}

module.exports = migrate_fresh;
