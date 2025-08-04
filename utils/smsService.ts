import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { Contact, database, SMSMessage, Thread } from "./database";

export interface SendSMSOptions {
  phoneNumber: string;
  message: string;
  simSlot?: number;
  deliveryReport?: boolean;
}

export interface SMSDeliveryStatus {
  messageId: string;
  status: "pending" | "sent" | "delivered" | "failed";
  timestamp: number;
  error?: string;
}

class SMSService {
  private listeners: Map<string, (message: SMSMessage) => void> = new Map();
  private deliveryListeners: Map<string, (status: SMSDeliveryStatus) => void> =
    new Map();
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    this.initializeNotifications();
    this.setupNativeEventListeners();
  }

  private async initializeNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
    }
  }

  private setupNativeEventListeners() {
    if (Platform.OS === "android") {
      try {
        const { SmsModule } = NativeModules;
        if (SmsModule) {
          this.eventEmitter = new NativeEventEmitter(SmsModule);

          // Listen for SMS sent events
          this.eventEmitter.addListener("onSmsSent", (data) => {
            this.handleSmsSent(data);
          });

          // Listen for SMS delivered events
          this.eventEmitter.addListener("onSmsDelivered", (data) => {
            this.handleSmsDelivered(data);
          });

          // Listen for SMS received events
          this.eventEmitter.addListener("onSmsReceived", (data) => {
            this.handleSmsReceived(data);
          });
        }
      } catch (error) {
        console.error("Error setting up native event listeners:", error);
      }
    }
  }

  private handleSmsSent(data: any) {
    const { messageId, status } = data;
    this.updateDeliveryStatus(messageId, status);
  }

  private handleSmsDelivered(data: any) {
    const { messageId } = data;
    this.updateDeliveryStatus(messageId, "delivered");
  }

  private handleSmsReceived(data: any) {
    const { address, body, date, simSlot } = data;
    this.receiveSMS({
      address,
      body,
      date,
      sim_slot: simSlot,
    });
  }

  // Request necessary permissions
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        // Request SMS permissions via native module
        const { SmsModule } = NativeModules;
        if (SmsModule && SmsModule.requestSmsPermissions) {
          await SmsModule.requestSmsPermissions();
        }

        const permissions = [
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(results).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          await this.loadContacts();
          return true;
        } else {
          console.warn("Some permissions were denied");
          return false;
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
        return false;
      }
    }
    return true;
  }

  // Load contacts from device
  private async loadContacts() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Name,
            Contacts.Fields.Image,
          ],
        });

        if (data.length > 0) {
          for (const contact of data) {
            if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
              const phoneNumbers = contact.phoneNumbers.map((pn) => pn.number);
              const contactData: Contact = {
                id: contact.id,
                name: contact.name || "Unknown",
                phone_numbers: phoneNumbers,
                avatar: contact.image?.uri,
                created_at: Date.now(),
                updated_at: Date.now(),
              };
              await database.insertContact(contactData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  }

  // Send SMS message using modern Android APIs
  async sendSMS(options: SendSMSOptions): Promise<string> {
    const {
      phoneNumber,
      message,
      simSlot = 0,
      deliveryReport = true,
    } = options;

    // Generate unique message ID
    const messageId = `sms_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const threadId = this.generateThreadId(phoneNumber);

    // Create SMS message object
    const smsMessage: SMSMessage = {
      id: messageId,
      thread_id: threadId,
      address: phoneNumber,
      body: message,
      type: "sent",
      read: true,
      date: Date.now(),
      date_sent: Date.now(),
      delivery_status: "pending",
      sim_slot: simSlot,
      mms: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // Get contact name if available
    const contact = await database.getContactByPhone(phoneNumber);
    if (contact) {
      smsMessage.contact_name = contact.name;
    }

    try {
      // Store message in database
      await database.insertSMS(smsMessage);

      // Update thread
      await this.updateThread(
        threadId,
        phoneNumber,
        contact?.name,
        message,
        "sms"
      );

      // Send SMS using native Android API
      await this.sendSMSViaAndroidAPI(phoneNumber, message, simSlot);

      return messageId;
    } catch (error) {
      console.error("Error sending SMS:", error);
      // Update message status to failed
      await database.updateSMSDeliveryStatus(messageId, "failed");
      throw error;
    }
  }

  // Send SMS using Android's SmsManager API
  private async sendSMSViaAndroidAPI(
    phoneNumber: string,
    message: string,
    simSlot: number
  ): Promise<void> {
    if (Platform.OS !== "android") {
      throw new Error("SMS sending is only supported on Android");
    }

    try {
      const { SmsModule } = NativeModules;
      if (SmsModule && SmsModule.sendSMS) {
        await SmsModule.sendSMS(phoneNumber, message, simSlot);
      } else {
        // Fallback to simulation if native module is not available
        console.warn("SMS native module not available, simulating send");
        await this.simulateSendSMS(phoneNumber, message);
      }
    } catch (error) {
      console.error("Error sending SMS via Android API:", error);
      // Fallback to simulation
      await this.simulateSendSMS(phoneNumber, message);
    }
  }

  // Simulate SMS sending for development/testing
  private async simulateSendSMS(phoneNumber: string, message: string) {
    return new Promise<void>((resolve) => {
      // Simulate network delay
      setTimeout(async () => {
        console.log(`Simulated SMS sent to ${phoneNumber}: ${message}`);
        resolve();
      }, 1000);
    });
  }

  // Update delivery status
  async updateDeliveryStatus(
    messageId: string,
    status: "pending" | "sent" | "delivered" | "failed"
  ) {
    await database.updateSMSDeliveryStatus(messageId, status);

    const deliveryStatus: SMSDeliveryStatus = {
      messageId,
      status,
      timestamp: Date.now(),
    };

    // Notify listeners
    this.deliveryListeners.forEach((listener) => {
      listener(deliveryStatus);
    });
  }

  // Receive SMS (called by BroadcastReceiver)
  async receiveSMS(data: any) {
    const messageId = `sms_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const threadId = this.generateThreadId(data.address);

    const smsMessage: SMSMessage = {
      id: messageId,
      thread_id: threadId,
      address: data.address,
      body: data.body,
      type: "inbox",
      read: false,
      date: data.date || Date.now(),
      date_sent: data.date_sent,
      delivery_status: "delivered",
      sim_slot: data.sim_slot,
      mms: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // Get contact name if available
    const contact = await database.getContactByPhone(data.address);
    if (contact) {
      smsMessage.contact_name = contact.name;
    }

    try {
      // Store message in database
      await database.insertSMS(smsMessage);

      // Update thread
      await this.updateThread(
        threadId,
        data.address,
        contact?.name,
        data.body,
        "sms"
      );

      // Send notification
      await this.sendNotification(smsMessage);

      // Notify listeners
      this.listeners.forEach((listener) => {
        listener(smsMessage);
      });
    } catch (error) {
      console.error("Error receiving SMS:", error);
    }
  }

  // Update thread information
  private async updateThread(
    threadId: string,
    address: string,
    contactName?: string,
    snippet?: string,
    type: "sms" | "mms" = "sms"
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

  // Send notification for new SMS
  private async sendNotification(sms: SMSMessage) {
    const contactName = sms.contact_name || sms.address;
    const messagePreview =
      sms.body.length > 50 ? `${sms.body.substring(0, 50)}...` : sms.body;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: contactName,
        body: messagePreview,
        data: { messageId: sms.id, threadId: sms.thread_id },
      },
      trigger: null, // Send immediately
    });
  }

  // Generate thread ID from phone number
  private generateThreadId(phoneNumber: string): string {
    const normalized = phoneNumber.replace(/\D/g, "");
    return `thread_${normalized}`;
  }

  // Get all threads
  async getAllThreads(): Promise<Thread[]> {
    return await database.getAllThreads();
  }

  // Get SMS messages for a thread
  async getMessagesForThread(
    threadId: string,
    limit = 50,
    offset = 0
  ): Promise<SMSMessage[]> {
    return await database.getSMSByThread(threadId, limit, offset);
  }

  // Search messages
  async searchMessages(query: string): Promise<SMSMessage[]> {
    return await database.searchSMS(query);
  }

  // Search threads
  async searchThreads(query: string): Promise<Thread[]> {
    return await database.searchThreads(query);
  }

  // Mark thread as read
  async markThreadAsRead(threadId: string): Promise<void> {
    await database.markThreadAsRead(threadId);
  }

  // Delete thread
  async deleteThread(threadId: string): Promise<void> {
    await database.deleteThread(threadId);
  }

  // Retry failed message
  async retryMessage(messageId: string): Promise<void> {
    const messages = await database.searchSMS(messageId);
    const message = messages.find((m) => m.id === messageId);

    if (message && message.delivery_status === "failed") {
      await this.sendSMS({
        phoneNumber: message.address,
        message: message.body,
        simSlot: message.sim_slot,
      });
    }
  }

  // Add message listener
  addMessageListener(id: string, listener: (message: SMSMessage) => void) {
    this.listeners.set(id, listener);
  }

  // Remove message listener
  removeMessageListener(id: string) {
    this.listeners.delete(id);
  }

  // Add delivery status listener
  addDeliveryListener(
    id: string,
    listener: (status: SMSDeliveryStatus) => void
  ) {
    this.deliveryListeners.set(id, listener);
  }

  // Remove delivery status listener
  removeDeliveryListener(id: string) {
    this.deliveryListeners.delete(id);
  }

  // Get delivery reports setting
  async getDeliveryReportsEnabled(): Promise<boolean> {
    const setting = await database.getSetting("delivery_reports");
    return setting === "true";
  }

  // Set delivery reports setting
  async setDeliveryReportsEnabled(enabled: boolean): Promise<void> {
    await database.setSetting("delivery_reports", enabled.toString());
  }

  // Get default SIM slot
  async getDefaultSimSlot(): Promise<number> {
    const setting = await database.getSetting("default_sim_slot");
    return setting ? parseInt(setting) : 0;
  }

  // Set default SIM slot
  async setDefaultSimSlot(slot: number): Promise<void> {
    await database.setSetting("default_sim_slot", slot.toString());
  }

  // Check if app is default SMS app
  async isDefaultSMSApp(): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    try {
      const { SmsModule } = NativeModules;
      if (SmsModule && SmsModule.isDefaultSMSApp) {
        return await SmsModule.isDefaultSMSApp();
      }
      return false;
    } catch (error) {
      console.error("Error checking default SMS app status:", error);
      return false;
    }
  }

  // Request to become default SMS app
  async requestDefaultSMSApp(): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    try {
      const { SmsModule } = NativeModules;
      if (SmsModule && SmsModule.requestDefaultSMSApp) {
        return await SmsModule.requestDefaultSMSApp();
      }
      return false;
    } catch (error) {
      console.error("Error requesting default SMS app:", error);
      return false;
    }
  }

  // Cleanup event listeners
  cleanup() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners("onSmsSent");
      this.eventEmitter.removeAllListeners("onSmsDelivered");
      this.eventEmitter.removeAllListeners("onSmsReceived");
    }
  }
}

export const smsService = new SMSService();
