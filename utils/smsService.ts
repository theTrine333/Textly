import { NativeEventEmitter, NativeModules } from "react-native";

const { SmsModule } = NativeModules;

export interface SearchParams {
  contact?: string;
  startDate?: number; // timestamp in ms
  endDate?: number; // timestamp in ms
  threadId?: string;
  messageContent?: string;
}

type SmsStatus =
  | "SENT_SUCCESS"
  | "SENT_FAILED"
  | "DELIVERED_SUCCESS"
  | "DELIVERED_FAILED";

const smsEvents = new NativeEventEmitter(SmsModule);

export const sendSmsWithStatus = (
  phoneNumber: string,
  message: string
): Promise<SmsStatus> => {
  return new Promise((resolve, reject) => {
    const sentSub = smsEvents.addListener("onSmsSent", (status: SmsStatus) => {
      if (status === "SENT_FAILED") {
        cleanup();
        reject(new Error("SMS sending failed"));
      }
    });

    const deliveredSub = smsEvents.addListener(
      "onSmsDelivered",
      (status: SmsStatus) => {
        cleanup();
        if (status === "DELIVERED_SUCCESS") {
          resolve(status);
        } else {
          reject(new Error("SMS delivery failed"));
        }
      }
    );

    const cleanup = () => {
      sentSub.remove();
      deliveredSub.remove();
    };

    SmsModule.sendSms(phoneNumber, message);
  });
};

// Listen for sent status
smsEvents.addListener("onSmsSent", (status: SmsStatus) => {
  console.log("SMS Sent Status:", status);
});

// Listen for delivery status
smsEvents.addListener("onSmsDelivered", (status: SmsStatus) => {
  console.log("SMS Delivery Status:", status);
});

export const sendSms = async (phoneNumber: string, message: string) => {
  return await SmsModule.sendSms(phoneNumber, message);
};

export const getAllSms = async () => {
  return await SmsModule.getAllSms();
};

export const searchSms = async (params: SearchParams) => {
  const { contact, startDate, endDate, threadId, messageContent } = params;
  return await SmsModule.searchSms(
    contact || null,
    startDate || null,
    endDate || null,
    threadId || null,
    messageContent || null
  );
};

export const requestDefaultSmsApp = async () => {
  try {
    const result = await SmsModule.requestDefaultSmsApp();
    console.log("Default SMS request triggered:", result);
  } catch (e) {
    console.error(e);
  }
};
