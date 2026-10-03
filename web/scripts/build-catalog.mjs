#!/usr/bin/env node
/*
  Reads the repository and writes lib/catalog.json — the roster from
  marketplace.json, each plugin's manifest, and each SKILL.md's frontmatter.

  It runs before `dev` and before `build`, and the output is committed, so the
  site can be built from a copy of web/ alone while a checkout keeps it honest.
  Doing this here rather than from a server component is what keeps the app free
  of filesystem access: nothing in the deployed output has to trace, or reach
  outside, the web/ directory.
*/
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(webRoot);
const out = join(webRoot, 'lib', 'catalog.json');

/* Agent Plugins 1.0 capability slots. A plugin creates only the ones it uses,
   so their presence on disk *is* the answer to "what does this carry". */
const capabilitySlots = [
  ['skills', 'skills'],
  ['agents', 'agents'],
  ['hooks', 'hooks'],
  ['resources', 'resources'],
  ['.mcp.json', 'mcp'],
];

function frontmatter(source) {
  // A SKILL.md opens with a `---` fenced YAML block; a file without one is a
  // skill with no declared policy, which is a valid (all-defaults) skill.
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return {};
  return parseYaml(match[1]) ?? {};
}

function readInvoke(raw) {
  // Absent means model + user: discoverable by the agent and callable by name.
  // Only an explicit `false` narrows it (ADR-030).
  if (!raw || typeof raw !== 'object') return { model: true, user: true };
  return { model: raw.model !== false, user: raw.user !== false };
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => statSync(join(dir, entry)).isFile())
    .sort();
}

function walk(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((entry) => {
      const full = join(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      return statSync(full).isDirectory() ? walk(full, rel) : [rel];
    });
}

function readSkills(pluginName, pluginDir) {
  const skillsDir = join(pluginDir, 'skills');
  if (!existsSync(skillsDir)) return [];

  return readdirSync(skillsDir)
    .filter((entry) => existsSync(join(skillsDir, entry, 'SKILL.md')))
    .sort()
    .map((id) => {
      const dir = join(skillsDir, id);
      const meta = frontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));

      return {
        id,
        name: typeof meta.name === 'string' ? meta.name : id,
        plugin: pluginName,
        description: typeof meta.description === 'string' ? meta.description.trim() : '',
        invoke: readInvoke(meta.invoke),
        compatibility: typeof meta.compatibility === 'string' ? meta.compatibility : null,
        references: listFiles(join(dir, 'references')),
        scripts: listFiles(join(dir, 'scripts')),
        path: `${pluginName}/skills/${id}`,
      };
    });
}

/*
  The repository is not always reachable from the build. A CLI deploy uploads
  `web/` alone, and a Git deploy can be configured to exclude files outside the
  root directory. lib/catalog.json is committed precisely for that case: keep
  the committed catalog and say so, rather than failing a build over a file
  whose content is already checked in.
*/
if (!existsSync(join(repoRoot, 'marketplace.json'))) {
  if (!existsSync(out)) {
    console.error('catalog: no ../marketplace.json and no committed lib/catalog.json to fall back to');
    process.exit(1);
  }
  console.warn('catalog: ../marketplace.json not reachable, keeping the committed lib/catalog.json');
  process.exit(0);
}

/* A plugin's icon is its docs page's `icon:` frontmatter, the same one the
   sidebar shows, so a card and its sidebar entry cannot disagree. */
function readIcon(name) {
  const page = join(webRoot, 'content', 'docs', 'plugins', `${name}.mdx`);
  if (!existsSync(page)) return null;
  const { icon } = frontmatter(readFileSync(page, 'utf8'));
  return typeof icon === 'string' ? icon : null;
}

const market = JSON.parse(readFileSync(join(repoRoot, 'marketplace.json'), 'utf8'));

const catalog = {
  owner: market.owner,
  plugins: market.plugins.map((entry) => {
    // `source` is relative to marketplace.json, which sits at the repo root.
    const dir = join(repoRoot, entry.source);
    const manifest = JSON.parse(readFileSync(join(dir, 'plugin.json'), 'utf8'));

    return {
      name: entry.name,
      description: manifest.description ?? '',
      keywords: manifest.keywords ?? [],
      category: entry.category ?? null,
      icon: readIcon(entry.name),
      skills: readSkills(entry.name, dir),
      carries: capabilitySlots
        .filter(([path]) => existsSync(join(dir, path)))
        .map(([, label]) => label),
      resources: walk(join(dir, 'resources')),
      path: entry.name,
    };
  }),
};

writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`);

const skills = catalog.plugins.reduce((total, plugin) => total + plugin.skills.length, 0);
console.log(`catalog: ${catalog.plugins.length} plugins, ${skills} skills -> lib/catalog.json`);
