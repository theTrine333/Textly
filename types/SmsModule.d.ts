declare module "react-native" {
  interface NativeModulesStatic {
    SmsModule: {
      /**
       * Send a plain SMS message
       */
      sendSms(to: string, message: string): Promise<void>;

      /**
       * Send an MMS message with attachments
       */
      sendMms(
        to: string,
        message: string,
        attachments: { uri: string; mimeType: string }[]
      ): Promise<void>;

      /**
       * Get all SMS messages
       */
      getAllMessages(): Promise<
        {
          id: string;
          address: string;
          body: string;
          date: number;
          type: "inbox" | "sent" | "draft" | "outbox";
          read: boolean;
        }[]
      >;

      /**
       * Get all chats/conversations
       */
      getChats(): Promise<
        {
          threadId: string;
          address: string;
          snippet: string;
          date: number;
          messageCount: number;
        }[]
      >;

      /**
       * Get all messages for a specific chat
       */
      getMessagesForThread(threadId: string): Promise<
        {
          id: string;
          address: string;
          body: string;
          date: number;
          type: "inbox" | "sent" | "draft" | "outbox";
          read: boolean;
        }[]
      >;

      /**
       * Delete a message by its ID
       */
      deleteMessage(messageId: string): Promise<void>;

      /**
       * Mark a message as read
       */
      markAsRead(messageId: string): Promise<void>;

      /**
       * Search messages by keyword
       */
      searchMessages(keyword: string): Promise<
        {
          id: string;
          address: string;
          body: string;
          date: number;
          type: "inbox" | "sent" | "draft" | "outbox";
          read: boolean;
        }[]
      >;

      /**
       * Delete an entire thread/conversation
       */
      deleteThread(threadId: string): Promise<void>;

      /**
       * Add listener for incoming messages
       * Event: 'onMessageReceived'
       */
      addOnMessageReceivedListener(
        callback: (message: {
          id: string;
          address: string;
          body: string;
          date: number;
        }) => void
      ): void;

      /**
       * Add listener for message status updates (sent/delivered)
       * Event: 'onMessageStatusChanged'
       */
      addOnMessageStatusListener(
        callback: (status: {
          messageId: string;
          status: "sent" | "delivered" | "failed";
        }) => void
      ): void;

      /**
       * Remove any previously added listeners
       */
      removeListeners(): void;

      /**
       * Register background listener (used for headless tasks)
       */
      registerBackgroundReceiver(): void;
    };
  }
}
