export const appName = 'ai';
export const appTagline = 'Personal AI tooling. Portable by default.';
export const appDescription =
  'Plugins for coding agents: an engineering standard, git conventions, terminal demos, dotfiles. Your agent reaches for them on its own.';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'hiukky',
  repo: 'ai',
  branch: 'main',
};

export const repoUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/** The marketplace handle every install command in the site is built from. */
export const marketplace = {
  /** `uze market add <handle>` */
  handle: `${gitConfig.user}/${gitConfig.repo}`,
  /** the suffix a plugin is addressed by once registered: `<plugin>@ai` */
  alias: 'ai',
};

/** The two install scopes, as every page spells them. */
export const installCommand = {
  project: (plugin: string) => `uze ${plugin}@${marketplace.alias}`,
  machine: (plugin: string) => `uze install ${plugin}@${marketplace.alias} -m`,
};

export const uze = {
  name: 'uze',
  url: 'https://uze.sh',
  repo: 'https://github.com/uze-sh/uze',
  install: 'curl -fsSL https://uze.sh/i | sh',
};
