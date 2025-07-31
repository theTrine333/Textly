interface chatType {
  id: string | "me";
  message: string | string[];
  time: string;
}

export default chatType;
