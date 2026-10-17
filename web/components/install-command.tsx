import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

/*
  A command to copy, as Fumadocs' own code block: the same component a fenced
  ```bash block renders, so a page never shows two kinds of command box.
*/
export function InstallCommand({
  command,
  label,
  className = '',
}: {
  command: string;
  /** shown above the block: say what running it does, not what it is */
  label?: string;
  className?: string;
}) {
  return (
    // `text-left`: this can sit inside a centred hero, and a centred shell
    // prompt reads as a caption.
    <div className={`text-left ${className}`}>
      {label ? <p className="mb-2 text-xs font-medium text-muted">{label}</p> : null}
      <CodeBlock className="my-0">
        <Pre>
          <code>
            <span className="line">{command}</span>
          </code>
        </Pre>
      </CodeBlock>
    </div>
  );
}
