import { describe, it, expect, afterAll } from "bun:test";
import {
  readFileSync,
  mkdtempSync,
  existsSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  statSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";

const createdDirs: string[] = [];

afterAll(() => {
  for (const dir of createdDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {}
  }
});

describe("create-rune", () => {
  it("has a main function entry", async () => {
    const mod = await import("../src/index");
    expect(mod).toBeDefined();
    expect(mod.main).toBeTypeOf("function");
  });

  it("creates project scaffold when main is called", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "rune-create-"));
    createdDirs.push(tmpDir);
    const originalArgv = process.argv;
    const originalCwd = process.cwd;

    process.argv = ["bun", "x", "test-project"];
    process.cwd = () => tmpDir;

    const { main } = await import("../src/index");
    await main();

    const projectDir = join(tmpDir, "test-project");
    expect(existsSync(join(projectDir, "src/main.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/app.module.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "src/controllers/app.controller.ts"))).toBe(true);
    expect(existsSync(join(projectDir, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(projectDir, "package.json"))).toBe(true);

    const pkg = readFileSync(join(projectDir, "package.json"), "utf-8");
    expect(pkg).toContain("@rune/core");

    process.argv = originalArgv;
    process.cwd = originalCwd;
  });

  it("creates nested directories using Windows backslash path parsing", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "rune-create-"));
    createdDirs.push(tmpDir);

    const testProjectPath = join(tmpDir, "test-project-win");
    mkdirSync(testProjectPath, { recursive: true });

    const srcDir = testProjectPath + "\\src";
    const controllerDir = srcDir + "\\controllers";
    mkdirSync(controllerDir, { recursive: true });

    const testFile = testProjectPath + "\\src\\controllers\\test.ts";
    writeFileSync(testFile, "export const test = true;");

    expect(existsSync(testFile)).toBe(true);

    const srcStat = statSync(testProjectPath + "\\src");
    expect(srcStat.isDirectory()).toBe(true);

    const ctrlStat = statSync(testProjectPath + "\\src\\controllers");
    expect(ctrlStat.isDirectory()).toBe(true);
  });

  it("template files contain expected content", () => {
    const mainContent = readFileSync(join(__dirname, "../src/index.ts"), "utf-8");
    expect(mainContent).toContain("src/main.ts");
    expect(mainContent).toContain("src/app.module.ts");
    expect(mainContent).toContain("src/controllers/app.controller.ts");
  });
});
