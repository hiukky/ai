import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    // The nav links repeat what the page tree already lists, and uze is linked
    // from the home page and the quickstart, so the docs carry none of them.
    <DocsLayout tree={source.getPageTree()} {...baseOptions()} links={[]}>
      {children}
    </DocsLayout>
  );
}
