// Pure HTML sanitizer for WYSIWYG notes. Strict allowlist: keeps a small set of
// formatting tags, strips ALL attributes, and removes scripts/styles/comments.
// Applied on both save and render (defense in depth). No DOM required — testable.

const ALLOWED = new Set(['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'div']);

export function sanitizeNotesHtml(html) {
  if (!html) return '';
  let s = String(html);
  // Remove <script>/<style> blocks including their content.
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Remove HTML comments.
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // Process every tag: keep allowed (attribute-stripped), drop the rest (keep inner text).
  s = s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?\/?>/g, (m, slash, tag) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return '';
    if (t === 'br') return '<br>';
    return `<${slash}${t}>`;
  });
  return s;
}
