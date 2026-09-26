import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Sparkle } from '@/components/sparkle';
import { appName, repoUrl, uze } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-baseline gap-2 font-mono font-semibold tracking-tight text-fd-foreground">
          <Sparkle className="size-3.5 self-center text-accent" />
          {appName}
          <span className="text-[11px] font-normal text-fd-muted-foreground">marketplace</span>
        </span>
      ),
    },
    links: [
      {
        text: 'Plugins',
        url: '/docs/plugins',
        active: 'url',
      },
      {
        text: 'Skills',
        url: '/docs/plugins/skills',
        active: 'nested-url',
      },
      {
        // The runtime this marketplace is installed through. Nothing here
        // installs without it, so it is the one nav item given a border rather
        // than left as a peer of the internal links.
        type: 'custom',
        children: (
          <a
            href={uze.url}
            target="_blank"
            rel="noreferrer"
            className="ms-1 inline-flex items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <span className="size-1.5 bg-accent" aria-hidden />
            {uze.name}
            <span aria-hidden>&#8599;</span>
          </a>
        ),
      },
    ],
    githubUrl: repoUrl,
  };
}
