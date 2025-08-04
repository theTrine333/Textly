interface chatType {
  id: string;
  text: string;
  sender: SenderType;
  timestamp: number;
  status?: "sent" | "delivered" | "read" | "failed" | "pending";
}

interface InlineEmojiTextProps {
  text: string;
  fontSize?: number;
}

export default chatType;

export type SenderType = "user" | "bot" | "system" | "contact";
