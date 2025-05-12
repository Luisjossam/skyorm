#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Comandos disponibles:");
  console.log("     [---- MIGRATIONS ----]");
  console.log("         create:migration <name> --pivot(optional) --ext=<ts,js>(opcional)");
  console.log("         migrate:run --config=<filename>(optional)");
  console.log("         migrate:rollback");
  console.log("         migrate:refresh");

  console.log("");
  console.log("     [---- MODELS ----]");
  console.log("         create:model <name> --ext=<ts,js>(optional)");

  process.exit(0);
}

const command = args[0];
const rest = args.slice(1);

switch (command) {
  case "create:migration":
    require("./commands/migrate_command")(rest);
    break;
  case "migrate:run":
    require("./commands/migrate_run")(rest);
    break;
  case "migrate:rollback":
    require("./commands/migrate_rollback")(rest);
    break;
  case "migrate:refresh":
    require("./commands/migrate_refresh")(rest);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
