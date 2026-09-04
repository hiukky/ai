import Link from 'next/link';
import { getPlugin, invokeLabel, plugins, skills, summarize, type Plugin, type Skill } from '@/lib/catalog';
import { gitConfig, marketplace, repoUrl } from '@/lib/shared';
import { InstallCommand } from './install-command';

/*
  Everything here renders from lib/catalog.ts, which reads the repository at
  build time. None of these components accept the facts they display. They
  accept a plugin name at most, so a page cannot describe a skill the repo no
  longer has.
*/

function sourceUrl(path: string) {
  return `${repoUrl}/blob/${gitConfig.branch}/${path}`;
}

export function InvokeBadge({ skill }: { skill: Skill }) {
  const label = invokeLabel(skill.invoke);
  // `model + user` is the default and the common case, so it is stated plainly.
  // A narrowed policy is the thing worth noticing, and gets the accent.
  const narrowed = label !== 'model + user';

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] ${
        narrowed ? 'text-accent' : 'text-muted'
      }`}
      title={
        narrowed
          ? 'this skill declares an invoke: block that narrows who may reach for it'
          : 'the default: the agent discovers it, and a person can call it by name'
      }
    >
      <span
        className={`size-1.5 shrink-0 ${narrowed ? 'bg-accent' : 'bg-muted/60'}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

/** Every skill in the marketplace, or every skill in one plugin. */
export function SkillTable({ plugin }: { plugin?: string }) {
  const rows = plugin ? (getPlugin(plugin)?.skills ?? []) : skills;

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="py-3 pe-4 font-mono text-xs font-normal text-muted">Skill</th>
            <th className="px-3 py-3 font-mono text-xs font-normal text-muted">Invoked by</th>
            <th className="ps-3 py-3 font-mono text-xs font-normal text-muted">What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((skill) => (
            <tr key={skill.path} className="border-b border-line/70 align-top">
              <th scope="row" className="py-4 pe-4 font-normal">
                <Link
                  href={`/docs/plugins/${skill.plugin}#${skill.id}`}
                  className="font-mono text-sm font-semibold whitespace-nowrap text-ink hover:text-accent transition-colors"
                >
                  {plugin ? skill.name : `${skill.plugin}:${skill.name}`}
                </Link>
              </th>
              <td className="px-3 py-4">
                <InvokeBadge skill={skill} />
              </td>
              <td className="ps-3 py-4 text-sm leading-relaxed text-muted">
                {summarize(skill.description)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  return (
    <li className="ai-card group flex flex-col p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-mono text-base font-semibold text-ink">
          {/* Stretched over the whole card, see .ai-card-target in global.css. */}
          <Link
            href={`/docs/plugins/${plugin.name}`}
            className="ai-card-target transition-colors group-hover:text-accent"
          >
            {plugin.name}
          </Link>
        </h3>
        <span className="font-mono text-[11px] text-muted">
          {plugin.skills.length} {plugin.skills.length === 1 ? 'skill' : 'skills'}
        </span>
      </div>

      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">
        {summarize(plugin.description)}
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
        {plugin.skills.map((skill) => (
          <li key={skill.id} className="font-mono text-xs text-ink">
            {/* Lifted above the stretched anchor so a skill still deep-links. */}
            <Link
              href={`/docs/plugins/${plugin.name}#${skill.id}`}
              className="ai-card-link transition-colors hover:text-accent"
            >
              {skill.name}
            </Link>
            {skill.invoke.model && skill.invoke.user ? null : (
              <span className="ms-1 text-accent" title={invokeLabel(skill.invoke)}>
                *
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function PluginCards() {
  return (
    <ul className="my-6 grid gap-4 not-prose sm:grid-cols-2">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.name} plugin={plugin} />
      ))}
    </ul>
  );
}

/** The header of a plugin's own page: what it carries, and how to install it. */
export function PluginHeader({ name }: { name: string }) {
  const plugin = getPlugin(name);
  if (!plugin) throw new Error(`No plugin named "${name}" in marketplace.json`);

  return (
    <div className="not-prose my-8 space-y-6">
      <dl className="grid gap-x-8 gap-y-4 border-y border-line py-5 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[11px] text-muted">Skills</dt>
          <dd className="mt-1 font-mono text-sm text-ink">
            {plugin.skills.map((skill) => skill.name).join(' · ')}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] text-muted">Carries</dt>
          <dd className="mt-1 font-mono text-sm text-ink">{plugin.carries.join(' · ')}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] text-muted">Keywords</dt>
          <dd className="mt-1 font-mono text-sm text-ink">{plugin.keywords.join(' · ')}</dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <InstallCommand
          label="on this machine, for every project"
          command={`uze plugin install ${plugin.name}@${marketplace.alias}`}
        />
        <InstallCommand
          label="in this project only, written to agents.lock"
          command={`uze ${plugin.name}@${marketplace.alias}`}
        />
      </div>
    </div>
  );
}

/** One section per skill, for a plugin's page. Headings are anchor targets. */
export function PluginSkills({ name }: { name: string }) {
  const plugin = getPlugin(name);
  if (!plugin) throw new Error(`No plugin named "${name}" in marketplace.json`);

  return (
    <div className="not-prose my-8 space-y-10">
      {plugin.skills.map((skill) => (
        <section key={skill.id} id={skill.id} className="scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-mono text-lg font-semibold text-ink">
              <a href={`#${skill.id}`} className="hover:text-accent transition-colors">
                {skill.name}
              </a>
            </h3>
            <InvokeBadge skill={skill} />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted">{skill.description}</p>

          {skill.compatibility ? (
            <p className="mt-3 border-s-2 border-line ps-3 font-mono text-xs leading-relaxed text-muted">
              <span className="text-ink">Needs: </span>
              {skill.compatibility}
            </p>
          ) : null}

          {skill.scripts.length ? (
            <p className="mt-3 font-mono text-xs text-muted">
              <span className="text-ink">Scripts: </span>
              {skill.scripts.join(', ')}
            </p>
          ) : null}

          {skill.references.length ? (
            <p className="mt-1.5 font-mono text-xs text-muted">
              <span className="text-ink">References: </span>
              {skill.references.join(', ')}
            </p>
          ) : null}

          <a
            href={sourceUrl(`${skill.path}/SKILL.md`)}
            className="mt-4 inline-block border-b border-accent/50 pb-0.5 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Read {skill.name}/SKILL.md
          </a>
        </section>
      ))}
    </div>
  );
}

/** What a plugin's `resources/` holds: files its skills read at runtime. */
export function PluginResources({ name }: { name: string }) {
  const plugin = getPlugin(name);
  if (!plugin) throw new Error(`No plugin named "${name}" in marketplace.json`);
  if (!plugin.resources.length) return null;

  return (
    <ul className="not-prose my-6 space-y-1.5 font-mono text-xs">
      {plugin.resources.map((file) => (
        <li key={file}>
          <a
            href={sourceUrl(`${plugin.name}/resources/${file}`)}
            className="text-muted transition-colors hover:text-accent"
          >
            <span className="text-accent">resources/</span>
            {file}
          </a>
        </li>
      ))}
    </ul>
  );
}
