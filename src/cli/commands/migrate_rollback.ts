import path from "path";
import Schema from "../Schema";
import Database from "../../database/database";

const basePath = path.resolve(process.cwd(), "src/migrations");
async function migrate_rollback(options: string[]) {
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
    const lastBatch = await schema.get_last_batch(connection);

    if (lastBatch === 0) {
      console.log("📦 No migrations to rollback.");
      process.exit(0);
    }
    const migrations = await schema.get_migrations_by_batch(lastBatch, connection);
    require("ts-node").register();
    for (const migration of migrations) {
      const migrationPath = path.join(basePath, migration);
      console.log(`⏪ Rolling back: ${migration}`);
      const migration_rollback = require(migrationPath).default;
      await migration_rollback.down(new Schema(options, migration, lastBatch));
    }
    console.log("✅ Rollback completed.");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    process.exit(1);
  } finally {
    connection.close();
  }
}
module.exports = migrate_rollback;
