import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { MMSAttachment, MMSMessage, SMSMessage } from "../utils/database";
import { mmsService } from "../utils/mmsService";
import { smsService } from "../utils/smsService";

interface MessageItemProps {
  message: SMSMessage | MMSMessage;
  isOwn: boolean;
  onRetry?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onRetry,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return "checkmark";
      case "delivered":
        return "checkmark-done";
      case "failed":
        return "close-circle";
      default:
        return "time";
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "#007AFF";
      case "delivered":
        return "#34C759";
      case "failed":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  return (
    <View style={[styles.messageContainer, isOwn && styles.ownMessage]}>
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isOwn
              ? isDark
                ? "#007AFF"
                : "#007AFF"
              : isDark
              ? "#2C2C2E"
              : "#E5E5EA",
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isOwn ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000",
            },
          ]}
        >
          {message.body}
        </Text>

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              {
                color: isOwn ? "#FFFFFF" : isDark ? "#8E8E93" : "#8E8E93",
              },
            ]}
          >
            {formatTime(message.date)}
          </Text>

          {isOwn && (
            <View style={styles.deliveryStatus}>
              <Ionicons
                name={getDeliveryStatusIcon(message.delivery_status)}
                size={16}
                color={getDeliveryStatusColor(message.delivery_status)}
              />
              {message.delivery_status === "failed" && onRetry && (
                <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                  <Ionicons name="refresh" size={14} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const threadId = params.threadId as string;
  const address = params.address as string;

  const [messages, setMessages] = useState<(SMSMessage | MMSMessage)[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    MMSAttachment[]
  >([]);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadMessages();
    setupListeners();
    markAsRead();
  }, [threadId]);

  const setupListeners = () => {
    // Listen for new messages in this thread
    smsService.addMessageListener(
      `conversation_${threadId}`,
      (message: SMSMessage) => {
        if (message.thread_id === threadId) {
          setMessages((prev) => [message, ...prev]);
        }
      }
    );

    mmsService.addMessageListener(
      `conversation_${threadId}`,
      (message: MMSMessage) => {
        if (message.thread_id === threadId) {
          setMessages((prev) => [message, ...prev]);
        }
      }
    );
  };

  const loadMessages = async () => {
    try {
      const smsMessages = await smsService.getMessagesForThread(threadId);
      setMessages(smsMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await smsService.markThreadAsRead(threadId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

    setSending(true);
    try {
      if (selectedAttachments.length > 0) {
        // Send MMS
        await mmsService.sendMMS({
          phoneNumbers: [address],
          message: newMessage.trim(),
          attachments: selectedAttachments,
        });
      } else {
        // Send SMS
        await smsService.sendSMS({
          phoneNumber: address,
          message: newMessage.trim(),
        });
      }

      setNewMessage("");
      setSelectedAttachments([]);
      setShowAttachments(false);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentPress = async () => {
    try {
      const mediaFiles = await mmsService.pickMedia();
      if (mediaFiles.length > 0) {
        const attachments: MMSAttachment[] = mediaFiles.map((file, index) => ({
          id: `att_${Date.now()}_${index}`,
          mms_id: "",
          content_type: file.type,
          name: file.name,
          size: file.size,
          path: file.uri,
          created_at: Date.now(),
        }));
        setSelectedAttachments(attachments);
        setShowAttachments(true);
      }
    } catch (error) {
      console.error("Error picking media:", error);
    }
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
    if (selectedAttachments.length === 1) {
      setShowAttachments(false);
    }
  };

  const retryMessage = async (messageId: string) => {
    try {
      await smsService.retryMessage(messageId);
    } catch (error) {
      console.error("Error retrying message:", error);
    }
  };

  const renderAttachment = (attachment: MMSAttachment, index: number) => (
    <View key={attachment.id} style={styles.attachmentItem}>
      <View style={styles.attachmentPreview}>
        <Ionicons
          name={
            attachment.content_type.startsWith("image/") ? "image" : "document"
          }
          size={24}
          color="#007AFF"
        />
      </View>
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={styles.attachmentSize}>
          {(attachment.size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeAttachment(index)}
        style={styles.removeAttachment}
      >
        <Ionicons name="close-circle" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#ffffff" },
        ]}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#ffffff" },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            {address}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem
            message={item}
            isOwn={item.type === "sent"}
            onRetry={() => retryMessage(item.id)}
          />
        )}
        inverted
        style={styles.messagesList}
      />

      {/* Attachments Preview */}
      {showAttachments && (
        <View style={styles.attachmentsContainer}>
          <FlatList
            data={selectedAttachments}
            horizontal
            renderItem={({ item, index }) => renderAttachment(item, index)}
            keyExtractor={(item) => item.id}
            style={styles.attachmentsList}
          />
        </View>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
        ]}
      >
        <TouchableOpacity
          onPress={handleAttachmentPress}
          style={styles.attachButton}
        >
          <Ionicons
            name="add"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
              color: isDark ? "#ffffff" : "#000000",
            },
          ]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Message"
          placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          onPress={sendMessage}
          disabled={
            sending || (!newMessage.trim() && selectedAttachments.length === 0)
          }
          style={[
            styles.sendButton,
            {
              backgroundColor:
                sending ||
                (!newMessage.trim() && selectedAttachments.length === 0)
                  ? isDark
                    ? "#2C2C2E"
                    : "#E5E5EA"
                  : "#007AFF",
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerButton: {
    marginLeft: 15,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 5,
    alignItems: "flex-start",
  },
  ownMessage: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },
  retryButton: {
    marginLeft: 5,
  },
  attachmentsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  attachmentsList: {
    maxHeight: 80,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    minWidth: 120,
  },
  attachmentPreview: {
    marginRight: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: "500",
  },
  attachmentSize: {
    fontSize: 10,
    color: "#8E8E93",
  },
  removeAttachment: {
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  attachButton: {
    marginRight: 10,
    padding: 5,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
