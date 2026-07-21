import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const formatsDir = path.join(repoRoot, "nvo-template", "formats");

const formatKeys = ["dubai_a", "dubai_b", "genericnvo1", "germany_a", "germany_b", "ireland", "newzealand", "singapore_a", "singapore_b"];

function readFormatConfig(key) {
  const configPath = path.join(formatsDir, key, "config.json");
  if (!existsSync(configPath)) return null;
  return JSON.parse(readFileSync(configPath, "utf-8"));
}

function buildFormatEntry(key) {
  const config = readFormatConfig(key);
  if (!config) return null;
  return {
    key,
    name: config.name,
    description: config.description,
    previewPath: config.previewPath,
    previewVideoPath: config.previewVideoPath,
    sourceDurationSeconds: config.sourceDurationSeconds,
    accent: config.accent,
    pill: config.pill,
    secondary: config.secondary,
    mergeLogosIntoHook: Boolean(config.mergeLogosIntoHook),
    mergeCtaIntoChecklist: Boolean(config.mergeCtaIntoChecklist),
    contentShape: config.contentShape ?? null,
    defaultHeroLine: config.defaultHeroLine,
    defaultSupportLine: config.defaultSupportLine,
    defaultProofLine: config.defaultProofLine,
    defaultCtaLine: config.defaultCtaLine,
    questions: config.questions ?? [],
  };
}

export function getFormatCatalog() {
  return formatKeys.map(buildFormatEntry).filter(Boolean);
}

export function getFormatByKey(key) {
  return getFormatCatalog().find((format) => format.key === key) ?? null;
}

export function resolveFormat(input) {
  if (!input) return getFormatByKey("genericnvo1");
  const normalized = String(input).trim().toLowerCase();
  const byKey = getFormatByKey(normalized);
  if (byKey) return byKey;
  return getFormatCatalog().find((format) => format.name.toLowerCase() === normalized) ?? null;
}

export function previewTextForFormat(key, cwd = process.cwd()) {
  const format = getFormatByKey(key) ?? getFormatByKey("genericnvo1");
  const previewPath = path.join(cwd, format.previewPath);
  const videoNote = format.previewVideoPath
    ? existsSync(path.join(cwd, format.previewVideoPath))
      ? `Original reference clip: ${format.previewVideoPath} (open it yourself to preview the real source — never pull footage/logos/copy from it into a new render)`
      : `Original reference clip expected at ${format.previewVideoPath} but not found on disk.`
    : "No original reference clip recorded for this format.";
  if (!existsSync(previewPath)) return [`${format.name}`, "", videoNote, "", `No structural findings notes found at ${format.previewPath}.`].join("\n");

  const content = readFileSync(previewPath, "utf-8");
  const previewLines = content.split(/\r?\n/).filter((line) => line.trim()).slice(0, 28);
  return [`${format.name} — ${format.description}`, "", videoNote, "", ...previewLines].join("\n");
}
