import data from './catalog.json';

/*
  The catalog is generated from the repository by scripts/build-catalog.mjs,
  which runs before `dev` and before `build`: marketplace.json for the roster,
  each plugin.json for the manifest, each SKILL.md's frontmatter for the
  capability and its invocation policy.

  Nothing here is transcribed by hand, so a skill that is renamed, added or made
  user-only changes the site on the next build and cannot be described here as
  something it stopped being. The one thing the site adds on top is editorial
  prose, which lives in content/docs/ where it is obviously prose.
*/

/** Who may reach for a skill. Absent frontmatter means both, the default. */
export type Invoke = { model: boolean; user: boolean };

export type Skill = {
  /** directory name under `<plugin>/skills/`, and the name it is invoked by */
  id: string;
  /** `name:` from the frontmatter; falls back to the directory name */
  name: string;
  plugin: string;
  description: string;
  invoke: Invoke;
  /** `compatibility:` from the frontmatter: external tools the skill needs */
  compatibility: string | null;
  /** files under `references/` the skill loads on demand */
  references: string[];
  /** executables under `scripts/` the skill drives */
  scripts: string[];
  /** repo path, for a "view source" link */
  path: string;
};

export type Plugin = {
  name: string;
  /** plugin.json description, the one a person reads in `uze list` */
  description: string;
  keywords: string[];
  /** marketplace.json category, the word the catalogue is browsed by */
  category: string | null;
  /** lucide icon name, from the plugin's docs page frontmatter */
  icon: string | null;
  skills: Skill[];
  /** capability directories actually present, in Agent Plugins 1.0 terms */
  carries: string[];
  /** files under `resources/`, which skills install into a project */
  resources: string[];
  path: string;
};

export type Catalog = {
  owner: { name: string; url: string };
  plugins: Plugin[];
};

export const catalog = data as Catalog;

export const plugins = catalog.plugins;

export const skills: Skill[] = plugins.flatMap((plugin) => plugin.skills);

export function getPlugin(name: string): Plugin | undefined {
  return plugins.find((plugin) => plugin.name === name);
}

/** How a skill's invocation policy reads in one phrase. */
export function invokeLabel(
  invoke: Invoke,
): 'model + user' | 'user only' | 'model only' | 'unreachable' {
  if (invoke.model && invoke.user) return 'model + user';
  if (invoke.user) return 'user only';
  if (invoke.model) return 'model only';
  return 'unreachable';
}

/**
 * The first sentence of a skill description. What follows it is trigger prose
 * written for the model, and reads as noise in a table.
 */
export function summarize(description: string): string {
  const end = description.search(/\.\s/);
  return end === -1 ? description : description.slice(0, end + 1);
}
