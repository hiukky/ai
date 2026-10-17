import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { InstallCommand } from '@/components/install-command';
import { PluginCard, PolicyDot } from '@/components/catalog';
import { Sparkle } from '@/components/sparkle';
import { plugins } from '@/lib/catalog';
import { appName, marketplace, repoUrl, uze } from '@/lib/shared';

/*
  Icon sources: Claude Code and OpenCode are simple-icons paths, recolored to
  the theme. Codex and Antigravity have no distinct mark of their own. Those
  are OpenAI's and Google Antigravity's own favicons, desaturated to sit in a
  monochrome row.
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
    narrowed: false,
    title: 'The default',
    body: 'The agent uses it when the work matches; you can call it by name. Almost every skill.',
  },
  {
    label: 'user only',
    narrowed: true,
    title: 'A deliberate action',
    body: 'Runs only when you call it. For skills that restructure a repository, like openspec:init.',
  },
  {
    label: 'model only',
    narrowed: true,
    title: 'Background work',
    body: 'The agent uses it; there is nothing to call. None in the catalog yet.',
  },
];

/** Large-screen column span for the card at `index` of `count`. */
function catalogSpan(index: number, count: number) {
  const remainder = count % 3;
  const inLastRow = index >= count - remainder;
  if (!inLastRow || remainder === 0) return 'lg:col-span-2';
  return remainder === 1 ? 'lg:col-span-6' : 'lg:col-span-3';
}

const skillCount = plugins.reduce((total, plugin) => total + plugin.skills.length, 0);

export default function HomePage() {
  return (
    <main className="flex flex-col items-center flex-1 px-4 sm:px-6">
      {/* Hero. The install line is the point of the page: someone who already
          runs uze needs exactly one command, and it is the first thing their
          eye lands on after the sentence that says what they are adding. The
          glass is earned here, over the one light field on the site. */}
      <section className="relative isolate flex w-full max-w-6xl flex-col items-center justify-center min-h-[calc(100dvh_-_3.5rem)] py-20 text-center">
        <div className="ai-field" aria-hidden>
          <div className="ai-light ai-light-a" />
          <div className="ai-light ai-light-b" />
        </div>

        <a
          href={uze.url}
          className="ai-glass inline-flex items-center gap-2 rounded-full py-1.5 ps-3 pe-3.5 text-[13px] text-muted transition-colors hover:text-ink"
        >
          <Sparkle className="size-3.5 text-ink" />
          {plugins.length} plugins, {skillCount} skills, installed through {uze.name}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>

        <h1 className="ai-display mt-8 max-w-[14ch] bg-gradient-to-b from-ink from-30% to-muted bg-clip-text pb-2 text-[3rem] text-transparent sm:text-7xl lg:text-[5.5rem]">
          Skills your agent already knows.
        </h1>

        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted sm:text-lg">
          Plugins for coding agents: an engineering standard, git conventions, terminal demos,
          dotfiles. Your agent reaches for them on its own.
        </p>

        <InstallCommand
          className="mt-10 w-full max-w-lg"
          command={`uze market add ${marketplace.handle}`}
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <Link
            href="/docs/quickstart"
            className="rounded-full bg-ink px-5 py-2.5 text-paper transition-opacity hover:opacity-85"
          >
            Get started
          </Link>
          <Link
            href="#catalog"
            className="ai-glass rounded-full px-5 py-2.5 text-ink transition-colors hover:border-ink/30"
          >
            Browse the catalog
          </Link>
        </div>

        {/* Reach: which agents a plugin from this catalog turns up in. */}
        <div className="mt-20 flex flex-col items-center gap-5">
          <p className="text-xs text-faint">One install, every agent on the machine</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
            {harnesses.map((harness) => (
              <li key={harness.name} className="flex items-center gap-2.5 text-sm font-medium text-muted">
                <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
                  {harness.icon.type === 'path' ? (
                    <path d={harness.icon.d} fill="currentColor" />
                  ) : (
                    <image
                      href={harness.icon.href}
                      width="24"
                      height="24"
                      style={{ filter: 'grayscale(1) contrast(1.1)' }}
                    />
                  )}
                </svg>
                {harness.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The catalog. The reason anyone is here, so it comes before any
          explanation of the machinery underneath it. Each card carries its
          own install line, so the reader leaves with the exact command. */}
      <section id="catalog" className="w-full max-w-6xl scroll-mt-20 py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="ai-title text-3xl text-ink sm:text-4xl">The catalog</h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">
              Each plugin stands alone. Take one, and nothing else comes with it.
            </p>
          </div>
          <p className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <PolicyDot narrowed={false} />
              agent or you
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PolicyDot narrowed />
              only when called
            </span>
          </p>
        </div>

        {/* Six columns so any count fills its rows: three to a row, and a row
            left short of three widens its cards to close the gap. */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {plugins.map((plugin, index) => (
            <PluginCard
              key={plugin.name}
              plugin={plugin}
              className={catalogSpan(index, plugins.length)}
            />
          ))}
        </ul>
      </section>

      {/* What a skill is here, and who may reach for it. The one concept the
          whole marketplace turns on, so it gets a section rather than a
          sentence in the docs. */}
      <section className="w-full max-w-6xl py-20 sm:py-28">
        <h2 className="ai-title text-3xl text-ink sm:text-4xl">Every capability is a skill</h2>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">
          One <code className="font-mono text-[0.9em] text-ink">SKILL.md</code> says what it does
          and who may call it. Each agent gets it in its own form: a slash command, a{' '}
          <code className="font-mono text-[0.9em] text-ink">$name</code>, or plain discovery.
        </p>

        <ul className="ai-glass mt-12 grid overflow-hidden rounded-[20px] sm:grid-cols-3">
          {policies.map((policy) => (
            <li
              key={policy.label}
              className="border-line p-7 not-first:border-t sm:not-first:border-t-0 sm:not-first:border-s"
            >
              <p className="inline-flex items-center gap-2 font-mono text-xs text-muted">
                <PolicyDot narrowed={policy.narrowed} />
                {policy.label}
              </p>
              <h3 className="ai-title mt-4 text-lg text-ink">{policy.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{policy.body}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/docs/plugins/skills"
          className="mt-8 inline-block text-sm font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          Every skill, and what triggers it
        </Link>
      </section>

      {/* uze. A mention, not a pitch: this marketplace is a catalog that one
          runtime knows how to install, and everything about that runtime is
          documented on its own site. */}
      <section className="w-full max-w-6xl pb-24 sm:pb-32">
        <div className="ai-glass relative isolate flex flex-col gap-10 overflow-hidden rounded-[28px] p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="ai-field" aria-hidden>
            <div className="ai-light ai-light-b" style={{ top: '-40%', left: '40%' }} />
          </div>
          <div>
            <h2 className="ai-title text-3xl text-ink sm:text-4xl">
              {appName} is the catalog. {uze.name} installs it.
            </h2>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
              No {uze.name} yet? One line, on Linux and macOS. Then{' '}
              <code className="font-mono text-[0.9em] text-ink">uze &lt;plugin&gt;@ai</code> adds
              a plugin to the project you are in, and{' '}
              <code className="font-mono text-[0.9em] text-ink">-m</code> on{' '}
              <code className="font-mono text-[0.9em] text-ink">uze install</code> adds it to the
              whole machine.
            </p>
          </div>

          <div className="w-full shrink-0 lg:max-w-md">
            <InstallCommand command={uze.install} />
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <a
                href={uze.url}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-paper transition-opacity hover:opacity-85"
              >
                {uze.url.replace('https://', '')}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
              <Link
                href="/docs/reference/adding-a-plugin"
                className="ai-glass rounded-full px-5 py-2.5 text-ink transition-colors hover:border-ink/30"
              >
                Add a plugin
              </Link>
              <a
                href={repoUrl}
                className="ai-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-ink transition-colors hover:border-ink/30"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                Source
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full max-w-6xl border-t border-line py-10">
        <p className="flex items-center justify-center gap-2 text-xs text-faint">
          <Sparkle className="size-3 text-muted" />
          Built by{' '}
          <a href="https://hiukky.com" className="text-muted transition-colors hover:text-ink">
            Romullo (@hiukky)
          </a>
        </p>
      </footer>
    </main>
  );
}
