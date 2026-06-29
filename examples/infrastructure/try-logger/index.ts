import { ConsoleLogger } from "@rune/logger";

const logger = new ConsoleLogger("MyApp");

logger.info("Server started on port 3000");
logger.warn("Memory usage high");
logger.error("Failed to connect", new Error("timeout"));
logger.debug("Request received", { method: "GET", path: "/hello" });
