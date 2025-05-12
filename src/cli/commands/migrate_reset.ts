import path from "path";
import Database from "../../database/database";
import Schema from "../Schema";
const basePath = path.resolve(process.cwd(), "src/migrations");

async function migrate_reset(options: string[]) {
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
  try {
    const migrations = await schema.get_all_migrations(connection);
    require("ts-node").register();
    for (const migration of migrations) {
      const migrationPath = path.join(basePath, migration.name);
      console.log(`⏪ Reset: ${migration.name}`);
      const migration_rollback = require(migrationPath).default;
      await migration_rollback.down(new Schema(options, migration.name, parseInt(migration.batch)));
    }
    console.log("✅ Reset completed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  } finally {
    connection.close();
  }
}
module.exports = migrate_reset;
