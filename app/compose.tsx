import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Contact, MMSAttachment } from "../utils/database";
import { mmsService } from "../utils/mmsService";
import { smsService } from "../utils/smsService";

interface ContactItemProps {
  contact: Contact;
  onPress: () => void;
  isSelected: boolean;
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  onPress,
  isSelected,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.contactItem,
        { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
        isSelected && { backgroundColor: isDark ? "#007AFF" : "#E3F2FD" },
      ]}
      onPress={onPress}
    >
      <View style={styles.contactAvatar}>
        <Ionicons
          name="person-circle"
          size={40}
          color={isSelected ? "#ffffff" : isDark ? "#ffffff" : "#000000"}
        />
      </View>
      <View style={styles.contactInfo}>
        <Text
          style={[
            styles.contactName,
            { color: isSelected ? "#ffffff" : isDark ? "#ffffff" : "#000000" },
          ]}
        >
          {contact.name}
        </Text>
        <Text
          style={[
            styles.contactPhone,
            { color: isSelected ? "#ffffff" : isDark ? "#cccccc" : "#666666" },
          ]}
        >
          {contact.phone_numbers[0]}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
      )}
    </TouchableOpacity>
  );
};

export default function ComposeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    MMSAttachment[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone_numbers.some((phone) => phone.includes(searchQuery))
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        const contactList: Contact[] = data
          .filter(
            (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0
          )
          .map((contact) => ({
            id: contact.id,
            name: contact.name || "Unknown",
            phone_numbers: contact.phoneNumbers!.map((pn) => pn.number),
            created_at: Date.now(),
            updated_at: Date.now(),
          }));

        setContacts(contactList);
        setFilteredContacts(contactList);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    const isSelected = selectedContacts.some((c) => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } else {
      setSelectedContacts((prev) => [...prev, contact]);
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
      }
    } catch (error) {
      console.error("Error picking media:", error);
    }
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const sendMessage = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert("Error", "Please select at least one contact.");
      return;
    }

    if (!message.trim() && selectedAttachments.length === 0) {
      Alert.alert("Error", "Please enter a message or add attachments.");
      return;
    }

    setSending(true);
    try {
      const phoneNumbers = selectedContacts.flatMap((c) => c.phone_numbers);

      if (selectedAttachments.length > 0) {
        // Send MMS
        await mmsService.sendMMS({
          phoneNumbers,
          message: message.trim(),
          subject: subject.trim() || undefined,
          attachments: selectedAttachments,
        });
      } else {
        // Send SMS to each contact
        for (const contact of selectedContacts) {
          for (const phoneNumber of contact.phone_numbers) {
            await smsService.sendSMS({
              phoneNumber,
              message: message.trim(),
            });
          }
        }
      }

      Alert.alert("Success", "Message sent successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#ffffff" },
      ]}
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
            name="close"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#ffffff" : "#000000" },
          ]}
        >
          New Message
        </Text>
        <TouchableOpacity
          onPress={sendMessage}
          disabled={
            sending ||
            selectedContacts.length === 0 ||
            (!message.trim() && selectedAttachments.length === 0)
          }
          style={[
            styles.sendButton,
            {
              backgroundColor:
                sending ||
                selectedContacts.length === 0 ||
                (!message.trim() && selectedAttachments.length === 0)
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

      <ScrollView style={styles.content}>
        {/* Selected Contacts */}
        {selectedContacts.length > 0 && (
          <View style={styles.selectedContactsContainer}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#ffffff" : "#000000" },
              ]}
            >
              To:
            </Text>
            <View style={styles.selectedContactsList}>
              {selectedContacts.map((contact) => (
                <View key={contact.id} style={styles.selectedContact}>
                  <Text
                    style={[
                      styles.selectedContactName,
                      { color: isDark ? "#ffffff" : "#000000" },
                    ]}
                  >
                    {contact.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeContact(contact.id)}
                    style={styles.removeContact}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Selection */}
        <TouchableOpacity
          onPress={() => setShowContacts(!showContacts)}
          style={[
            styles.contactSelector,
            { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
          ]}
        >
          <Ionicons
            name="person-add"
            size={20}
            color={isDark ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.contactSelectorText,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            {selectedContacts.length > 0
              ? `${selectedContacts.length} contact(s) selected`
              : "Add contacts"}
          </Text>
          <Ionicons
            name={showContacts ? "chevron-up" : "chevron-down"}
            size={20}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        {/* Contacts List */}
        {showContacts && (
          <View style={styles.contactsContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                  color: isDark ? "#ffffff" : "#000000",
                },
              ]}
              placeholder="Search contacts..."
              placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ContactItem
                  contact={item}
                  onPress={() => handleContactSelect(item)}
                  isSelected={selectedContacts.some((c) => c.id === item.id)}
                />
              )}
              style={styles.contactsList}
            />
          </View>
        )}

        {/* Subject (for MMS) */}
        {selectedAttachments.length > 0 && (
          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDark ? "#ffffff" : "#000000" },
              ]}
            >
              Subject:
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                  color: isDark ? "#ffffff" : "#000000",
                },
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject (optional)"
              placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
            />
          </View>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.inputLabel,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Message:
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
                color: isDark ? "#ffffff" : "#000000",
              },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor={isDark ? "#8E8E93" : "#8E8E93"}
            multiline
            maxLength={1000}
          />
        </View>

        {/* Attachments */}
        <View style={styles.attachmentsContainer}>
          <TouchableOpacity
            onPress={handleAttachmentPress}
            style={styles.attachButton}
          >
            <Ionicons
              name="attach"
              size={20}
              color={isDark ? "#ffffff" : "#000000"}
            />
            <Text
              style={[
                styles.attachText,
                { color: isDark ? "#ffffff" : "#000000" },
              ]}
            >
              Add attachment
            </Text>
          </TouchableOpacity>

          {selectedAttachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {selectedAttachments.map((attachment, index) =>
                renderAttachment(attachment, index)
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  selectedContactsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  selectedContactsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  selectedContact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
    marginBottom: 5,
  },
  selectedContactName: {
    color: "#ffffff",
    fontSize: 14,
    marginRight: 5,
  },
  removeContact: {
    marginLeft: 5,
  },
  contactSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 20,
  },
  contactSelectorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  contactsContainer: {
    marginBottom: 20,
  },
  searchInput: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  contactsList: {
    maxHeight: 200,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
  },
  contactAvatar: {
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  attachmentsContainer: {
    marginBottom: 20,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  attachText: {
    marginLeft: 10,
    fontSize: 16,
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
  },
  attachmentPreview: {
    marginRight: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "500",
  },
  attachmentSize: {
    fontSize: 12,
    color: "#8E8E93",
  },
  removeAttachment: {
    marginLeft: 5,
  },
});
