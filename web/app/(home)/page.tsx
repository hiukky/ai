import Link from 'next/link';
import { InstallCommand } from '@/components/install-command';
import { PluginCard } from '@/components/catalog';
import { Sparkle } from '@/components/sparkle';
import { plugins, skills } from '@/lib/catalog';
import { appName, appTagline, installCommand, marketplace, repoUrl, uze } from '@/lib/shared';

/*
  Icon sources: Claude Code and OpenCode are simple-icons paths, recolored to
  the theme. Codex and Antigravity have no distinct mark of their own. Those
  are OpenAI's and Google Antigravity's own favicons, at their real colors.
*/
const harnesses = [
  {
    name: 'Claude Code',
    icon: {
      type: 'path' as const,
      d: 'M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z',
    },
  },
  { name: 'Codex', icon: { type: 'image' as const, href: '/harnesses/codex.png' } },
  { name: 'OpenCode', icon: { type: 'path' as const, d: 'M22 24H2V0h20zM17 4.8H7v14.4h10z' } },
  { name: 'Antigravity', icon: { type: 'image' as const, href: '/harnesses/antigravity.png' } },
];

const policies = [
  {
    label: 'model + user',
    accent: false,
    title: 'The default',
    body: 'The agent uses it when the work matches; you can call it by name. Almost every skill.',
  },
  {
    label: 'user only',
    accent: true,
    title: 'A deliberate action',
    body: 'Runs only when you call it. For skills that restructure a repository, like openspec:init.',
  },
  {
    label: 'model only',
    accent: true,
    title: 'Background work',
    body: 'The agent uses it; there is nothing to call. None in the catalog yet.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center flex-1 px-6 font-sans">
      {/* Hero. The install line is the point of the page: someone who already
          runs uze needs exactly one command, and it should be the first thing
          their eye lands on after the sentence that says what they are adding. */}
      <section className="flex w-full max-w-5xl flex-col justify-center min-h-[calc(100dvh_-_3.5rem)] py-16 text-center">
        <p className="font-mono text-xs tracking-tight text-muted">
          <Sparkle className="me-2 inline-block size-3.5 -translate-y-px align-middle text-accent" />
          {appTagline}
        </p>

        <h1 className="mx-auto mt-6 max-w-[20ch] font-mono font-bold tracking-tight text-ink text-[2.5rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
          Skills your agent
          <br />
          <span className="text-accent">already knows.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
          Plugins for coding agents: an engineering standard, git conventions, terminal demos,
          dotfiles. Your agent reaches for them on its own.
        </p>

        <div className="ai-bloom mx-auto mt-10 w-full max-w-xl">
          <InstallCommand command={`uze market add ${marketplace.handle}`} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs">
          <Link
            href="/docs/quickstart"
            className="border-b border-accent/50 pb-0.5 text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Get started
          </Link>
          <Link
            href="/docs/plugins"
            className="border-b border-line pb-0.5 text-muted transition-colors hover:border-accent hover:text-ink"
          >
            Browse the catalog
          </Link>
          <a
            href={uze.url}
            className="border-b border-line pb-0.5 text-muted transition-colors hover:border-accent hover:text-ink"
          >
            Don&apos;t have {uze.name}?
          </a>
        </div>
      </section>

      {/* The catalog. The reason anyone is here, so it comes before any
          explanation of the machinery underneath it. */}
      <section className="w-full max-w-5xl border-t border-line py-20 sm:py-24">
        <h2 className="font-mono text-2xl font-bold tracking-tight text-ink">The catalog</h2>
        <p className="mt-2.5 max-w-[68ch] text-sm leading-relaxed text-muted">
          Each plugin stands alone. Take one, and nothing else comes with it.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.name} plugin={plugin} />
          ))}
        </ul>

        <p className="mt-6 font-mono text-xs text-muted">
          <span className="text-accent">*</span> runs only when you call it.
        </p>
      </section>

      {/* What a skill is here, and who may reach for it. This is the one
          concept the whole marketplace turns on, so it gets a section rather
          than a sentence in the docs. */}
      <section className="w-full max-w-5xl border-t border-line py-20 sm:py-24">
        <h2 className="font-mono text-2xl font-bold tracking-tight text-ink">
          Every capability is a skill
        </h2>
        <p className="mt-2.5 max-w-[68ch] text-sm leading-relaxed text-muted">
          One <code className="font-mono text-ink">SKILL.md</code> says what it does and who may
          call it. Each agent gets it in its own form: a slash command, a{' '}
          <code className="font-mono text-ink">$name</code>, or plain discovery.
        </p>

        <ul className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-3">
          {policies.map((policy) => (
            <li key={policy.label}>
              <p
                className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
                  policy.accent ? 'text-accent' : 'text-muted'
                }`}
              >
                <span
                  className={`size-1.5 ${policy.accent ? 'bg-accent' : 'bg-muted/60'}`}
                  aria-hidden
                />
                {policy.label}
              </p>
              <h3 className="mt-2.5 font-mono text-base font-semibold text-ink">{policy.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{policy.body}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/docs/plugins/skills"
          className="mt-10 inline-block border-b border-accent/50 pb-0.5 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Every skill, and what triggers it
        </Link>
      </section>

      {/* uze. A mention, not a pitch: this marketplace is a catalog that one
          runtime knows how to install, and everything about that runtime is
          documented on its own site. What belongs here is the reach (which
          agents a skill installed from this catalog turns up in) and one
          unmissable way out to the rest. */}
      <section className="w-full max-w-5xl border-t border-line py-20 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="font-mono text-xs text-muted">Installed through</p>
            <h2 className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-ink">
              {uze.name}
            </h2>
            <p className="mt-2.5 max-w-[52ch] text-sm leading-relaxed text-muted">
              {appName} is the catalog; {uze.name} installs it. One install, and the plugin is in
              every coding agent on the machine.
            </p>
          </div>

          <a
            href={uze.url}
            className="ai-bloom inline-flex shrink-0 items-center gap-2.5 border border-ink bg-ink px-6 py-3 font-mono text-sm text-paper transition-opacity hover:opacity-85"
          >
            <span className="size-1.5 bg-accent" aria-hidden />
            {uze.url.replace('https://', '')}
            <span aria-hidden>&#8599;</span>
          </a>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {harnesses.map((harness) => (
            <li key={harness.name} className="flex flex-col items-center gap-2.5 text-center">
              <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
                {harness.icon.type === 'path' ? (
                  <path d={harness.icon.d} fill="var(--color-ink)" />
                ) : (
                  <image href={harness.icon.href} width="24" height="24" />
                )}
              </svg>
              <span className="font-mono text-sm font-semibold text-ink">{harness.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Install. Every plugin, addressable, in one place, so the reader
          leaves with the exact line for the one they came for. */}
      <section className="w-full max-w-5xl border-t border-line py-20 sm:py-24">
        <h2 className="font-mono text-2xl font-bold tracking-tight text-ink">Then take what you need</h2>
        <p className="mt-2.5 max-w-[68ch] text-sm leading-relaxed text-muted">
          <code className="font-mono text-ink">uze &lt;plugin&gt;@ai</code> adds it to the project
          you are in. Add <code className="font-mono text-ink">-m</code> to{' '}
          <code className="font-mono text-ink">uze install</code> for the whole machine.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {plugins.map((plugin) => (
            <InstallCommand
              key={plugin.name}
              label={plugin.name}
              command={installCommand.project(plugin.name)}
            />
          ))}
        </div>

        <p className="mt-5 font-mono text-xs text-muted">
          No {uze.name} yet? <span className="text-ink">{uze.install}</span>. Linux and macOS.{' '}
          <a href={uze.url} className="text-ink transition-colors hover:text-accent">
            Everything else it does &#8599;
          </a>
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-4 font-mono text-xs">
          <Link
            href="/docs/quickstart"
            className="border border-ink bg-ink px-5 py-2.5 text-paper transition-opacity hover:opacity-85"
          >
            Get started
          </Link>
          <Link
            href="/docs/reference/adding-a-plugin"
            className="border border-line px-5 py-2.5 text-ink transition-colors hover:bg-surface"
          >
            Add a plugin
          </Link>
          <a
            href={repoUrl}
            className="inline-flex items-center gap-2 border border-line px-5 py-2.5 text-ink transition-colors hover:bg-surface"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            Browse the source
          </a>
        </div>
      </section>

      <footer className="w-full max-w-5xl border-t border-line py-14 text-center">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] text-muted">
          <Sparkle className="size-3.5 text-accent" />
          Built with 🖤 by{' '}
          <a href="https://hiukky.com" className="text-ink transition-colors hover:text-accent">
            Romullo (@hiukky)
          </a>
        </p>
      </footer>
    </main>
  );
}
