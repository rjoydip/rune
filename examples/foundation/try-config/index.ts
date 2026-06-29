import { ConfigLoader } from "@rune/config";

const config = new ConfigLoader();
config.set("PORT", "3000");
config.set("DATABASE_URL", "postgres://localhost/db");

console.log(`Port: ${config.get("PORT")}`);
console.log(`DB: ${config.get("DATABASE_URL")}`);
console.log(`Debug: ${config.get("DEBUG", "false")}`);
