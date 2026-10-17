import Link from 'next/link';
import { icons } from 'lucide-react';
import { getPlugin, invokeLabel, plugins, skills, summarize, type Plugin, type Skill } from '@/lib/catalog';
import { gitConfig, installCommand, repoUrl } from '@/lib/shared';
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

/** The plugin's lucide icon, as its docs page declares it. */
export function PluginIcon({ plugin, className }: { plugin: Plugin; className?: string }) {
  const Icon = icons[(plugin.icon ?? '') as keyof typeof icons] ?? icons.Puzzle;
  return <Icon className={className} aria-hidden />;
}

export function InvokeBadge({ skill }: { skill: Skill }) {
  const label = invokeLabel(skill.invoke);
  // `model + user` is the default and the common case, so it is stated
  // quietly. A narrowed policy is the thing worth noticing: the dot fills.
  const narrowed = label !== 'model + user';

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        narrowed ? 'border-ink/25 text-ink' : 'border-line text-muted'
      }`}
      title={
        narrowed
          ? 'this skill declares an invoke: block that narrows who may reach for it'
          : 'the default: the agent discovers it, and a person can call it by name'
      }
    >
      <PolicyDot narrowed={narrowed} />
      {label}
    </span>
  );
}

/** Hollow for the default policy, filled for a narrowed one. */
export function PolicyDot({ narrowed }: { narrowed: boolean }) {
  return (
    <span
      className={`size-1.5 shrink-0 rounded-full ${
        narrowed ? 'bg-ink' : 'border border-faint'
      }`}
      aria-hidden
    />
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
            <th className="py-3 pe-4 text-xs font-medium text-muted">Skill</th>
            <th className="px-3 py-3 text-xs font-medium text-muted">Invoked by</th>
            <th className="ps-3 py-3 text-xs font-medium text-muted">What it does</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((skill) => (
            <tr key={skill.path} className="border-b border-line align-top">
              <th scope="row" className="py-4 pe-4 font-normal">
                <Link
                  href={`/docs/plugins/${skill.plugin}#${skill.id}`}
                  className="font-mono text-[13px] font-medium whitespace-nowrap text-ink underline-offset-4 hover:underline"
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

export function PluginCard({ plugin, className = '' }: { plugin: Plugin; className?: string }) {
  return (
    <li className={`ai-glass ai-card group flex flex-col rounded-[20px] p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="ai-glass grid size-10 shrink-0 place-items-center rounded-xl">
          <PluginIcon plugin={plugin} className="size-[18px] text-ink" />
        </div>
        <span className="text-xs text-faint tabular-nums">
          {plugin.skills.length} {plugin.skills.length === 1 ? 'skill' : 'skills'}
        </span>
      </div>

      <h3 className="ai-title mt-5 text-lg text-ink">
        {/* Stretched over the whole card, see .ai-card-target in global.css. */}
        <Link href={`/docs/plugins/${plugin.name}`} className="ai-card-target">
          {plugin.name}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {summarize(plugin.description)}
      </p>

      <ul className="mt-5 flex flex-wrap gap-1.5">
        {plugin.skills.map((skill) => {
          const narrowed = !(skill.invoke.model && skill.invoke.user);
          return (
            <li key={skill.id}>
              {/* Lifted above the stretched anchor so a skill still deep-links. */}
              <Link
                href={`/docs/plugins/${plugin.name}#${skill.id}`}
                title={invokeLabel(skill.invoke)}
                className="ai-card-link inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11.5px] text-ink transition-colors hover:border-ink/30"
              >
                <PolicyDot narrowed={narrowed} />
                {skill.name}
              </Link>
            </li>
          );
        })}
      </ul>

      <InstallCommand
        className="ai-card-link mt-5"
        command={installCommand.project(plugin.name)}
      />
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
      <dl className="ai-glass grid gap-x-8 gap-y-5 rounded-[20px] p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted">Skills</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {plugin.skills.map((skill) => (
              <a
                key={skill.id}
                href={`#${skill.id}`}
                className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-ink transition-colors hover:border-ink/30"
              >
                {skill.name}
              </a>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Carries</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {plugin.carries.map((item) => (
              <span
                key={item}
                className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted"
              >
                {item}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <InstallCommand label="this project" command={installCommand.project(plugin.name)} />
        <InstallCommand label="this machine" command={installCommand.machine(plugin.name)} />
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
            <h3 className="ai-title font-mono text-lg text-ink">
              <a href={`#${skill.id}`} className="underline-offset-4 hover:underline">
                {skill.name}
              </a>
            </h3>
            <InvokeBadge skill={skill} />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted">{skill.description}</p>

          {skill.compatibility ? (
            <p className="mt-3 border-s-2 border-line ps-3 text-xs leading-relaxed text-muted">
              <span className="font-medium text-ink">Needs </span>
              {skill.compatibility}
            </p>
          ) : null}

          {skill.scripts.length ? (
            <p className="mt-3 font-mono text-xs text-muted">
              <span className="font-sans font-medium text-ink">Scripts </span>
              {skill.scripts.join(', ')}
            </p>
          ) : null}

          {skill.references.length ? (
            <p className="mt-1.5 font-mono text-xs text-muted">
              <span className="font-sans font-medium text-ink">References </span>
              {skill.references.join(', ')}
            </p>
          ) : null}

          <a
            href={sourceUrl(`${skill.path}/SKILL.md`)}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
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
            className="text-muted transition-colors hover:text-ink"
          >
            <span className="text-faint">resources/</span>
            {file}
          </a>
        </li>
      ))}
    </ul>
  );
}
