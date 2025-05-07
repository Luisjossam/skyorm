#!/usr/bin/env node
import path from "path";
import fs from "fs";
import Schema from "../Schema";

const basePath = path.resolve(process.cwd(), "src/migrations");

async function runMigrations(options: string[]) {
  const files = fs.readdirSync(basePath).filter((file) => file);
  for (const file of files) {
    const migrationPath = path.join(basePath, file);
    console.log(`🔄 Running: ${file}`);
    if (file.endsWith(".js")) {
      const migration = require(migrationPath).default;
      await migration.up(new Schema(options));
    } else {
      require("ts-node").register();
      const migration = require(migrationPath).default;
      await migration.up(new Schema(options));
    }
  }
}
module.exports = runMigrations;
