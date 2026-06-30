import { stdin as input, stdout as output } from "node:process";
import { checkbox } from "@inquirer/prompts";
import { Command } from "commander";
import { runNpxSkillsAdd } from "../lib/runNpxSkills.js";
import {
  DOMAINS_SKILL_ID,
  MANDATORY_SKILL_ID,
  orderedRemoteSkillIds,
  validateSkillIds,
  REMOTE_SOURCE,
} from "../lib/skillCatalog.js";

/**
 * Install a skill from c456-com/skills via npx skills add.
 */
async function installSkill(skillId, base) {
  console.error(`→ npx skills add ${REMOTE_SOURCE} --skill ${skillId} …`);
  await runNpxSkillsAdd(REMOTE_SOURCE, { ...base, skill: skillId });
  console.log(`✅ 已安装 ${skillId}（来源：${REMOTE_SOURCE}）`);
}

async function installSkillSet(idSet, base) {
  const order = orderedRemoteSkillIds(idSet);
  for (const id of order) {
    await installSkill(id, base);
  }
}

/**
 * Remotely list available c456 skill IDs (excluding mandatory c456-cli).
 */
async function fetchRemoteSkillIds() {
  // Fetch the registry.json from c456-com/skills GitHub
  const url = `https://raw.githubusercontent.com/${REMOTE_SOURCE}/main/registry.json`;
  try {
    const res = await fetch(url);
    const reg = await res.json();
    return reg.skills
      .map((s) => s.name)
      .filter((id) => id !== MANDATORY_SKILL_ID && id !== "tmux-cursor-agent")
      .sort();
  } catch {
    return [];
  }
}

async function promptInteractiveSelection() {
  if (!input.isTTY || !output.isTTY) {
    console.error("提示：非交互终端未展示菜单，仅安装 c456-cli。请显式指定：c456 skill install <技能id> …");
    return new Set([MANDATORY_SKILL_ID]);
  }

  const CANCEL_VALUE = "__cancel__";
  const remoteIds = await fetchRemoteSkillIds();

  const choices = [
    {
      name: "c456-cli（必选）",
      value: MANDATORY_SKILL_ID,
      checked: true,
      description: "终端与 HTTP API 说明",
    },
    {
      name: "llm-wiki-domains（可选）",
      value: DOMAINS_SKILL_ID,
      description: "多领域知识库导航（c456-com/skills）",
    },
    ...(remoteIds.length > 0
      ? remoteIds.map((id) => ({ name: id, value: id }))
      : [{ name: "(远程技能列表获取失败，请指定 --with-wiki 或技能 id)", value: "__placeholder__", disabled: true }]
    ),
    { name: "取消安装", value: CANCEL_VALUE },
  ];

  try {
    const picked = await checkbox({
      message: "选择要安装的技能",
      pageSize: 14,
      loop: true,
      required: false,
      validate: (selection) => {
        const ids = new Set(selection.map((c) => c.value));
        if (ids.has(CANCEL_VALUE)) return true;
        if (!ids.has(MANDATORY_SKILL_ID)) return "请勾选 c456-cli，或勾选「取消安装」";
        return true;
      },
      instructions: "↑↓ 移动，空格 勾选，回车 确认",
      shortcuts: { all: null, invert: null },
      choices,
    });
    if (picked.includes(CANCEL_VALUE)) {
      console.error("\n已取消安装。");
      process.exit(0);
    }
    return new Set([MANDATORY_SKILL_ID, ...picked]);
  } catch (e) {
    const n = e && typeof e === "object" && "name" in e ? e.name : "";
    if (n === "CancelPromptError" || n === "AbortPromptError") {
      console.error("\n已取消安装。");
      process.exit(130);
    }
    throw e;
  }
}

const skillCmd = new Command("skill")
  .name("skill")
  .description("安装 Agent 技能（npx skills add c456-com/skills）");

skillCmd
  .command("install")
  .description("TTY 多选；传技能 id 免交互；--with-wiki 装知识库三件套")
  .argument("[skillIds...]", "技能 id，可多个；与 c456-cli 一并安装")
  .option("-C, --cwd <path>", "skills add 的工作目录（默认当前目录）")
  .option("-g, --global", "用户级技能目录", false)
  .option("-a, --agent <names>", "目标 Agent，默认 cursor", "cursor")
  .option("--copy", "复制文件而非 symlink", false)
  .option("--with-wiki", "llm-wiki-domains + c456-llm-wiki + c456-cli，不经菜单", false)
  .action(async (skillIds, opts) => {
    const cwd = String(opts.cwd || process.cwd());
    const base = {
      cwd,
      global: Boolean(opts.global),
      agent: String(opts.agent ?? "cursor").trim() || "cursor",
      copy: Boolean(opts.copy),
    };

    if (opts.withWiki) {
      await installSkillSet(
        new Set([DOMAINS_SKILL_ID, "c456-llm-wiki", MANDATORY_SKILL_ID]),
        base,
      );
      return;
    }

    const fromCli = skillIds ? (Array.isArray(skillIds) ? skillIds : [String(skillIds).trim()]).filter(Boolean) : [];
    let toInstall;

    if (fromCli.length > 0) {
      const expanded = new Set(fromCli);
      expanded.add(MANDATORY_SKILL_ID);
      const { ok, bad } = validateSkillIds([...expanded]);
      if (!ok) {
        console.error(`错误：未知技能 id：${bad.join(", ")}。`);
        process.exit(1);
      }
      toInstall = expanded;
    } else {
      toInstall = await promptInteractiveSelection();
    }

    await installSkillSet(toInstall, base);
  });

export default skillCmd;
