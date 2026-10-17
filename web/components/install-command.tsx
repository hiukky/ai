import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { highlight } from 'fumadocs-core/highlight';
import { codeThemes } from '@/lib/code-theme';

/*
  A command to copy, as Fumadocs' own code block, highlighted by the same
  theme as a fenced ```bash block: a page never shows two kinds of command
  box. Async, so the highlighting happens at render on the server and ships
  as markup.
*/
export async function InstallCommand({
  command,
  label,
  className = '',
}: {
  command: string;
  /** shown above the block: say what running it does, not what it is */
  label?: string;
  className?: string;
}) {
  const rendered = await highlight(command, {
    lang: 'bash',
    themes: codeThemes,
    // As fenced blocks are rendered: colours only as variables, so `.dark`
    // switches them instead of the light theme being inlined.
    defaultColor: false,
    components: {
      pre: (props) => (
        <CodeBlock className="my-0">
          <Pre {...props} />
        </CodeBlock>
      ),
    },
  });

  return (
    // `text-left`: this can sit inside a centred hero, and a centred shell
    // prompt reads as a caption.
    <div className={`text-left ${className}`}>
      {label ? <p className="mb-2 text-xs font-medium text-muted">{label}</p> : null}
      {rendered}
    </div>
  );
}
