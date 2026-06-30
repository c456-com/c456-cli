export const DOMAINS_SKILL_ID = "llm-wiki-domains";
export const MANDATORY_SKILL_ID = "c456-cli";
const REMOTE_SOURCE = "c456-com/skills";

/**
 * Order skill IDs: domains → c456-llm-wiki → rest → c456-cli.
 * @param {Set<string>|string[]} selected
 * @returns {string[]}
 */
export function orderedRemoteSkillIds(selected) {
  const set = new Set(Array.isArray(selected) ? selected : [...selected]);
  const out = [];
  if (set.has(DOMAINS_SKILL_ID)) out.push(DOMAINS_SKILL_ID);
  const mid = [...set]
    .filter((id) => id !== DOMAINS_SKILL_ID && id !== MANDATORY_SKILL_ID)
    .sort((a, b) => {
      if (a === "c456-llm-wiki" && b !== "c456-llm-wiki") return -1;
      if (b === "c456-llm-wiki" && a !== "c456-llm-wiki") return 1;
      return a.localeCompare(b);
    });
  out.push(...mid);
  if (set.has(MANDATORY_SKILL_ID)) out.push(MANDATORY_SKILL_ID);
  return out;
}

/**
 * Validate skill IDs against allowed set.
 * @param {string[]} requested
 * @returns {{ ok: boolean, bad: string[] }}
 */
export function validateSkillIds(requested) {
  const allowed = [DOMAINS_SKILL_ID, MANDATORY_SKILL_ID, "c456-llm-wiki",
    "c456-product-channel-article", "c456-signal-product-vs",
    "c456-signal-researcher", "c456-sync-public-markdown"];
  const set = new Set(allowed);
  const bad = requested.filter((id) => !set.has(id));
  return { ok: bad.length === 0, bad };
}

export { REMOTE_SOURCE };
