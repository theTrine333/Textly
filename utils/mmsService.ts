import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { database, MMSAttachment, MMSMessage, Thread } from "./database";

export interface SendMMSOptions {
  phoneNumbers: string[];
  message?: string;
  subject?: string;
  attachments: MMSAttachment[];
  simSlot?: number;
  deliveryReport?: boolean;
}

export interface MMSDeliveryStatus {
  messageId: string;
  status: "pending" | "sent" | "delivered" | "failed";
  timestamp: number;
  error?: string;
}

export interface MediaFile {
  uri: string;
  type: string;
  name: string;
  size: number;
}

class MMSService {
  private listeners: Map<string, (message: MMSMessage) => void> = new Map();
  private deliveryListeners: Map<string, (status: MMSDeliveryStatus) => void> =
    new Map();

  constructor() {
    this.initializeMediaLibrary();
  }

  private async initializeMediaLibrary() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Media library permissions not granted");
    }
  }

  // Pick media files from device
  async pickMedia(): Promise<MediaFile[]> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const mediaFiles: MediaFile[] = [];

        for (const asset of result.assets) {
          if (asset.uri) {
            const fileInfo: any = await FileSystem.getInfoAsync(asset.uri);
            const mediaFile: MediaFile = {
              uri: asset.uri,
              type: this.getMimeType(asset.uri),
              name: this.getFileName(asset.uri),
              size: fileInfo.size || 0,
            };
            mediaFiles.push(mediaFile);
          }
        }

        return mediaFiles;
      }
    } catch (error) {
      console.error("Error picking media:", error);
    }

    return [];
  }

  // Get MIME type from file extension
  private getMimeType(uri: string): string {
    const extension = uri.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "mp4":
        return "video/mp4";
      case "avi":
        return "video/x-msvideo";
      case "mov":
        return "video/quicktime";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "aac":
        return "audio/aac";
      default:
        return "application/octet-stream";
    }
  }

  // Get file name from URI
  private getFileName(uri: string): string {
    const parts = uri.split("/");
    return parts[parts.length - 1];
  }

  // Send MMS message
  async sendMMS(options: SendMMSOptions): Promise<string> {
    const {
      phoneNumbers,
      message = "",
      subject,
      attachments,
      simSlot = 0,
      deliveryReport = true,
    } = options;

    // Generate unique message ID
    const messageId = `mms_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const threadId = this.generateThreadId(phoneNumbers[0]);

    // Create MMS message object
    const mmsMessage: MMSMessage = {
      id: messageId,
      thread_id: threadId,
      address: phoneNumbers.join(","),
      body: message,
      subject,
      type: "sent",
      read: true,
      date: Date.now(),
      date_sent: Date.now(),
      delivery_status: "pending",
      sim_slot: simSlot,
      attachment_count: attachments.length,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      // Store MMS message in database
      await database.insertMMS(mmsMessage);

      // Store attachments
      for (const attachment of attachments) {
        attachment.mms_id = messageId;
        await database.insertMMSAttachment(attachment);
      }

      // Update thread
      await this.updateThread(
        threadId,
        phoneNumbers[0],
        undefined,
        message,
        "mms"
      );

      // Simulate MMS sending
      await this.simulateSendMMS(messageId, phoneNumbers, message, attachments);

      return messageId;
    } catch (error) {
      console.error("Error sending MMS:", error);
      await this.updateDeliveryStatus(messageId, "failed");
      throw error;
    }
  }

  // Simulate MMS sending (replace with actual native implementation)
  private async simulateSendMMS(
    messageId: string,
    phoneNumbers: string[],
    message: string,
    attachments: MMSAttachment[]
  ) {
    // Simulate network delay
    setTimeout(async () => {
      await this.updateDeliveryStatus(messageId, "sent");

      setTimeout(async () => {
        await this.updateDeliveryStatus(messageId, "delivered");
      }, 3000);
    }, 2000);
  }

  // Update delivery status
  async updateDeliveryStatus(
    messageId: string,
    status: "pending" | "sent" | "delivered" | "failed"
  ) {
    // Update in database
    await database.updateSMSDeliveryStatus(messageId, status);

    const deliveryStatus: MMSDeliveryStatus = {
      messageId,
      status,
      timestamp: Date.now(),
    };

    // Notify listeners
    this.deliveryListeners.forEach((listener) => {
      listener(deliveryStatus);
    });
  }

  // Receive MMS (called by BroadcastReceiver)
  async receiveMMS(data: any) {
    const messageId = `mms_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const threadId = this.generateThreadId(data.address);

    const mmsMessage: MMSMessage = {
      id: messageId,
      thread_id: threadId,
      address: data.address,
      body: data.body || "",
      subject: data.subject,
      type: "inbox",
      read: false,
      date: data.date || Date.now(),
      date_sent: data.date_sent,
      delivery_status: "delivered",
      sim_slot: data.sim_slot,
      attachment_count: data.attachments?.length || 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // Get contact name if available
    const contact = await database.getContactByPhone(data.address);
    if (contact) {
      mmsMessage.contact_name = contact.name;
    }

    try {
      // Store MMS message in database
      await database.insertMMS(mmsMessage);

      // Process attachments if available
      if (data.attachments && data.attachments.length > 0) {
        for (const attachmentData of data.attachments) {
          const attachment: MMSAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            mms_id: messageId,
            content_type: attachmentData.content_type,
            name: attachmentData.name,
            size: attachmentData.size,
            path: attachmentData.path,
            thumbnail_path: attachmentData.thumbnail_path,
            created_at: Date.now(),
          };
          await database.insertMMSAttachment(attachment);
        }
      }

      // Update thread
      await this.updateThread(
        threadId,
        data.address,
        contact?.name,
        mmsMessage.body,
        "mms"
      );

      // Send notification
      await this.sendNotification(mmsMessage);

      // Notify listeners
      this.listeners.forEach((listener) => {
        listener(mmsMessage);
      });
    } catch (error) {
      console.error("Error receiving MMS:", error);
    }
  }

  // Update thread information
  private async updateThread(
    threadId: string,
    address: string,
    contactName?: string,
    snippet?: string,
    type: "sms" | "mms" = "mms"
  ) {
    const now = Date.now();

    // Get existing thread or create new one
    const threads = await database.getAllThreads();
    const existingThread = threads.find((t) => t.id === threadId);

    const thread: Thread = {
      id: threadId,
      address,
      contact_name: contactName,
      snippet: snippet || existingThread?.snippet || "",
      message_count: (existingThread?.message_count || 0) + 1,
      unread_count: existingThread?.unread_count || 0,
      date: now,
      type,
      archived: existingThread?.archived || false,
      pinned: existingThread?.pinned || false,
      created_at: existingThread?.created_at || now,
      updated_at: now,
    };

    await database.insertThread(thread);
  }

  // Send notification for new MMS
  private async sendNotification(mms: MMSMessage) {
    const contactName = mms.contact_name || mms.address;
    const hasAttachments = mms.attachment_count > 0;
    const messagePreview = hasAttachments
      ? `📎 ${mms.attachment_count} attachment${
          mms.attachment_count > 1 ? "s" : ""
        }`
      : mms.body.length > 50
      ? `${mms.body.substring(0, 50)}...`
      : mms.body;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: contactName,
        body: messagePreview,
        data: { messageId: mms.id, threadId: mms.thread_id },
      },
      trigger: null, // Send immediately
    });
  }

  // Generate thread ID from phone number
  private generateThreadId(phoneNumber: string): string {
    const normalized = phoneNumber.replace(/\D/g, "");
    return `thread_${normalized}`;
  }

  // Get MMS attachments
  async getMMSAttachments(mmsId: string): Promise<MMSAttachment[]> {
    return await database.getMMSAttachments(mmsId);
  }

  // Download MMS attachment
  async downloadAttachment(attachment: MMSAttachment): Promise<string> {
    try {
      const downloadDir = `${FileSystem.documentDirectory}attachments/`;
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, {
          intermediates: true,
        });
      }

      const fileName = `${attachment.id}_${attachment.name || "attachment"}`;
      const localPath = `${downloadDir}${fileName}`;

      // Copy file to local storage
      await FileSystem.copyAsync({
        from: attachment.path,
        to: localPath,
      });

      return localPath;
    } catch (error) {
      console.error("Error downloading attachment:", error);
      throw error;
    }
  }

  // Create thumbnail for media attachment
  async createThumbnail(attachment: MMSAttachment): Promise<string | null> {
    if (
      !attachment.content_type.startsWith("image/") &&
      !attachment.content_type.startsWith("video/")
    ) {
      return null;
    }

    try {
      const thumbnailDir = `${FileSystem.documentDirectory}thumbnails/`;
      const dirInfo = await FileSystem.getInfoAsync(thumbnailDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(thumbnailDir, {
          intermediates: true,
        });
      }

      const thumbnailPath = `${thumbnailDir}thumb_${attachment.id}.jpg`;

      // For now, we'll just copy the original file as thumbnail
      // In a real implementation, you'd use image processing to create actual thumbnails
      await FileSystem.copyAsync({
        from: attachment.path,
        to: thumbnailPath,
      });

      return thumbnailPath;
    } catch (error) {
      console.error("Error creating thumbnail:", error);
      return null;
    }
  }

  // Add message listener
  addMessageListener(id: string, listener: (message: MMSMessage) => void) {
    this.listeners.set(id, listener);
  }

  // Remove message listener
  removeMessageListener(id: string) {
    this.listeners.delete(id);
  }

  // Add delivery status listener
  addDeliveryListener(
    id: string,
    listener: (status: MMSDeliveryStatus) => void
  ) {
    this.deliveryListeners.set(id, listener);
  }

  // Remove delivery status listener
  removeDeliveryListener(id: string) {
    this.deliveryListeners.delete(id);
  }

  // Get MMS auto-download setting
  async getAutoDownloadEnabled(): Promise<boolean> {
    const setting = await database.getSetting("mms_auto_download");
    return setting === "true";
  }

  // Set MMS auto-download setting
  async setAutoDownloadEnabled(enabled: boolean): Promise<void> {
    await database.setSetting("mms_auto_download", enabled.toString());
  }

  // Get MMS Wi-Fi only setting
  async getWiFiOnlyEnabled(): Promise<boolean> {
    const setting = await database.getSetting("mms_wifi_only");
    return setting === "true";
  }

  // Set MMS Wi-Fi only setting
  async setWiFiOnlyEnabled(enabled: boolean): Promise<void> {
    await database.setSetting("mms_wifi_only", enabled.toString());
  }
}

export const mmsService = new MMSService();
