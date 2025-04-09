#!/usr/bin/env node
import path from "path";
import fs from "fs";
import Schema from "../Schema"; // Tu clase para construir queries
import { fileURLToPath } from "url";

const basePath = path.resolve(process.cwd(), "src/migrations");

function runMigrations() {
  const files = fs.readdirSync(basePath).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const migrationPath = path.join(basePath, file);
    const migration = require(migrationPath).default;

    console.log(`🔄 Running: ${file}`);
    migration.up(new Schema()); // Asegúrate de pasar una instancia de tu clase Schema
  }

  console.log("✅ Migrations executed");
}
module.exports = runMigrations;
