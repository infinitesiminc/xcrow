/**
 * Check if a string is a standard emoji (not CJK, Latin, etc.)
 * Returns true for emoji, false for regular text characters.
 */
export function isStandardEmoji(str: string | null | undefined): boolean {
  if (!str) return false;
  // Match common emoji ranges (emoji presentation sequences, pictographic, etc.)
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  return emojiRegex.test(str);
}
