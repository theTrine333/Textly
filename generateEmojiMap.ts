// generateEmojiMap.ts
import fs from "fs";
import path from "path";

// Minimal emoji-to-name mapping (extend this with more)
const emojiToName: Record<string, string> = {
  "😂": "joy",
  "❤️": "red-heart",
  "🤣": "rolling-on-the-floor-laughing",
  "😍": "heart-eyes",
  "😭": "loudly-crying",
  "😊": "smiling-face-with-smiling-eyes",
  "😒": "unamused",
  "😘": "face-blowing-a-kiss",
  "😁": "beaming-smile",
  "💕": "two-hearts",
  "👍": "thumbs-up",
  "😢": "crying-face",
  "👏": "clapping-hands",
  "🔥": "fire",
  "🙄": "eye-roll",
  "🤔": "thinking-face",
  "😎": "smiling-face-with-sunglasses",
  "💔": "broken-heart",
  "🥺": "pleading-face",
  "😅": "grinning-with-sweat",
  "🤗": "hugging-face",
  "😴": "sleeping-face",
  "😆": "grinning-squinting-face",
  "🙃": "upside-down-face",
  "😤": "face-with-steam-from-nose",
};

const emojiDir = path.join(__dirname, "assets/emojis");

const outputLines: string[] = [
  `export const emojiMap: Record<string, any> = {`,
];

for (const [emoji, name] of Object.entries(emojiToName)) {
  const filePath = path.join(emojiDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    outputLines.push(`  "${emoji}": require("../assets/emojis/${name}.json"),`);
  } else {
    console.warn(`⚠️ Missing file for emoji "${emoji}" (${name})`);
  }
}

outputLines.push(`};`);

fs.writeFileSync(path.join(__dirname, "emojiMap.ts"), outputLines.join("\n"));
console.log("✅ emojiMap.ts generated!");
