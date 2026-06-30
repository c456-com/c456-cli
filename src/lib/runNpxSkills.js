import { spawn } from "node:child_process";

/**
 * 调用官方 `npx skills add c456-com/skills --skill <name>`。
 * @param {string} source  GitHub source (e.g. `c456-com/skills`)
 * @param {{ cwd?: string, global?: boolean, agent?: string, copy?: boolean, skill?: string }} opts
 */
export function runNpxSkillsAdd(source, opts = {}) {
  const {
    cwd = process.cwd(),
    global = false,
    agent = "cursor",
    copy = false,
    skill = "c456-cli",
  } = opts;

  const args = ["--yes", "skills", "add", source, "--skill", skill, "-y"];
  if (global) args.push("-g");
  if (agent) args.push("--agent", agent);
  if (copy) args.push("--copy");

  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) { resolve(); return; }
      const sig = signal ? ` signal=${signal}` : "";
      reject(new Error(`npx skills add 退出码 ${code ?? "?"}${sig}`));
    });
  });
}
