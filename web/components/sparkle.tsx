/*
  The `ai` mark. A four-pointed sparkle, the shape that reads as "generated"
  without a single word of explanation.

  It stands for the site itself, so it appears exactly where the site is naming
  itself: the wordmark, the hero eyebrow, the footer signature, the favicon.
  The small filled squares elsewhere are a different thing: an accent tick on
  a link, a status dot on an invocation policy. They stay squares, so the
  sparkle never turns into ambient decoration that means nothing.
*/
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      {/* Concave four-point star: each arc bends toward the centre, which is
          what separates a sparkle from a plain diamond at 12px. */}
      <path d="M12 1C12 7.075 16.925 12 23 12C16.925 12 12 16.925 12 23C12 16.925 7.075 12 1 12C7.075 12 12 7.075 12 1Z" />
    </svg>
  );
}
