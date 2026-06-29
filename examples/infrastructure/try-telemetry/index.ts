import { NoopTelemetry } from "@rune/telemetry";

const telemetry = new NoopTelemetry();

const span = telemetry.startSpan("http.request", { method: "GET" });
span.setAttribute("http.method", "GET");
span.addEvent("cache.miss", { key: "user:1" });
span.setStatus({ code: 1, message: "Success" });
span.end();

telemetry.recordException(new Error("test error"));
console.log("Telemetry example complete");
