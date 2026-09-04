export const appName = 'ai';
export const appTagline = 'Personal AI tooling. Portable by default.';
export const appDescription =
  'A UZE marketplace of self-contained plugins: an engineering standard, git conventions, and a toolkit for recording terminal UIs. Every capability is a skill your agent discovers on its own.';

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

export const uze = {
  name: 'uze',
  url: 'https://uze.hiukky.com',
  repo: 'https://github.com/hiukky/uze',
  install: 'curl -fsSL https://uze.hiukky.com/i | sh',
};
