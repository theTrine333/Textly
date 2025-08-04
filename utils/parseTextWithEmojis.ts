import emojiRegex from "emoji-regex";

interface EmojiPart {
  type: "emoji" | "text";
  value: string;
  code: string; // Only for emoji parts
}

export function parseTextWithEmojis(text: string): EmojiPart[] {
  const regex = emojiRegex();
  const result: EmojiPart[] = [];

  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const emoji = match[0];
    const index = match.index || 0;

    // Add preceding text if any
    if (lastIndex < index) {
      result.push({
        type: "text",
        value: text.slice(lastIndex, index),
        code: "",
      });
    }

    // Add the emoji with code
    const codepoint = Array.from(emoji)
      .map((char) => char.codePointAt(0)?.toString(16))
      .filter(Boolean)
      .map((cp) => `u${cp}`)
      .join("_");

    result.push({
      type: "emoji",
      value: emoji,
      code: "@/assets/emoji-json/emoji_" + codepoint.replace("u", "") + ".json",
    });

    lastIndex = index + emoji.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push({
      type: "text",
      value: text.slice(lastIndex),
      code: "",
    });
  }

  return result;
}
