#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Comandos disponibles:");
  console.log("         --help");
  console.log("         create:migration <name> pivot(optional)");
  console.log("         migrate:run --config=<filename>(optional)");
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
  default:
    console.error(`Comando desconocido: ${command}`);
    process.exit(1);
}
