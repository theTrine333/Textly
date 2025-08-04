import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Contact, SMSMessage, Thread } from "../utils/database";
import { smsService } from "../utils/smsService";

interface SearchResult {
  type: "message" | "thread" | "contact";
  data: SMSMessage | Thread | Contact;
}

interface SearchResultItemProps {
  result: SearchResult;
  onPress: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const renderMessage = (message: SMSMessage) => (
    <View style={styles.resultItem}>
      <View style={styles.resultIcon}>
        <Ionicons name="chatbubble" size={20} color="#007AFF" />
      </View>
      <View style={styles.resultContent}>
        <Text
          style={[
            styles.resultTitle,
            { color: isDark ? "#ffffff" : "#000000" },
          ]}
        >
          {message.contact_name || message.address}
        </Text>
        <Text
          style={[
            styles.resultSubtitle,
            { color: isDark ? "#cccccc" : "#666666" },
          ]}
          numberOfLines={2}
        >
          {message.body}
        </Text>
        <Text
          style={[styles.resultTime, { color: isDark ? "#888888" : "#999999" }]}
        >
          {new Date(message.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderThread = (thread: Thread) => (
    <View style={styles.resultItem}>
      <View style={styles.resultIcon}>
        <Ionicons name="chatbubbles" size={20} color="#007AFF" />
      </View>
      <View style={styles.resultContent}>
        <Text
          style={[
            styles.resultTitle,
            { color: isDark ? "#ffffff" : "#000000" },
          ]}
        >
          {thread.contact_name || thread.address}
        </Text>
        <Text
          style={[
            styles.resultSubtitle,
            { color: isDark ? "#cccccc" : "#666666" },
          ]}
          numberOfLines={1}
        >
          {thread.snippet}
        </Text>
        <Text
          style={[styles.resultTime, { color: isDark ? "#888888" : "#999999" }]}
        >
          {thread.message_count} messages •{" "}
          {new Date(thread.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderContact = (contact: Contact) => (
    <View style={styles.resultItem}>
      <View style={styles.resultIcon}>
        <Ionicons name="person" size={20} color="#007AFF" />
      </View>
      <View style={styles.resultContent}>
        <Text
          style={[
            styles.resultTitle,
            { color: isDark ? "#ffffff" : "#000000" },
          ]}
        >
          {contact.name}
        </Text>
        <Text
          style={[
            styles.resultSubtitle,
            { color: isDark ? "#cccccc" : "#666666" },
          ]}
        >
          {contact.phone_numbers.join(", ")}
        </Text>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      style={[
        styles.resultContainer,
        { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
      ]}
      onPress={onPress}
    >
      {result.type === "message" && renderMessage(result.data as SMSMessage)}
      {result.type === "thread" && renderThread(result.data as Thread)}
      {result.type === "contact" && renderContact(result.data as Contact)}
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "messages" | "threads" | "contacts"
  >("all");

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeFilter]);

  const performSearch = async () => {
    if (searchQuery.trim().length === 0) return;

    setLoading(true);
    try {
      const results: SearchResult[] = [];

      // Search messages
      if (activeFilter === "all" || activeFilter === "messages") {
        const messages = await smsService.searchMessages(searchQuery);
        results.push(
          ...messages.map((message) => ({
            type: "message" as const,
            data: message,
          }))
        );
      }

      // Search threads
      if (activeFilter === "all" || activeFilter === "threads") {
        const threads = await smsService.searchThreads(searchQuery);
        results.push(
          ...threads.map((thread) => ({
            type: "thread" as const,
            data: thread,
          }))
        );
      }

      // Search contacts (this would need to be implemented)
      if (activeFilter === "all" || activeFilter === "contacts") {
        // Placeholder for contact search
        // const contacts = await contactService.searchContacts(searchQuery);
        // results.push(...contacts.map(contact => ({
        //   type: 'contact' as const,
        //   data: contact,
        // })));
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === "message") {
      const message = result.data as SMSMessage;
      router.push({
        pathname: "/conversation",
        params: { threadId: message.thread_id, address: message.address },
      });
    } else if (result.type === "thread") {
      const thread = result.data as Thread;
      router.push({
        pathname: "/conversation",
        params: { threadId: thread.id, address: thread.address },
      });
    } else if (result.type === "contact") {
      const contact = result.data as Contact;
      // Navigate to compose with contact pre-selected
      router.push({
        pathname: "/compose",
        params: { contactId: contact.id },
      });
    }
  };

  const FilterButton: React.FC<{
    title: string;
    filter: "all" | "messages" | "threads" | "contacts";
    active: boolean;
    onPress: () => void;
  }> = ({ title, filter, active, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: active ? "#007AFF" : isDark ? "#2C2C2E" : "#F2F2F7",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: active ? "#ffffff" : isDark ? "#ffffff" : "#000000" },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
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
            name="arrow-back"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={isDark ? "#888888" : "#666666"}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages, threads, contacts..."
            placeholderTextColor={isDark ? "#888888" : "#666666"}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? "#888888" : "#666666"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="All"
          filter="all"
          active={activeFilter === "all"}
          onPress={() => setActiveFilter("all")}
        />
        <FilterButton
          title="Messages"
          filter="messages"
          active={activeFilter === "messages"}
          onPress={() => setActiveFilter("messages")}
        />
        <FilterButton
          title="Threads"
          filter="threads"
          active={activeFilter === "threads"}
          onPress={() => setActiveFilter("threads")}
        />
        <FilterButton
          title="Contacts"
          filter="contacts"
          active={activeFilter === "contacts"}
          onPress={() => setActiveFilter("contacts")}
        />
      </View>

      {/* Search Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Searching...
          </Text>
        </View>
      ) : searchQuery.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.type}_${index}`}
          renderItem={({ item }) => (
            <SearchResultItem
              result={item}
              onPress={() => handleResultPress(item)}
            />
          )}
          style={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search"
                size={48}
                color={isDark ? "#888888" : "#666666"}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#888888" : "#666666" },
                ]}
              >
                No results found for "{searchQuery}"
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search"
            size={48}
            color={isDark ? "#888888" : "#666666"}
          />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? "#888888" : "#666666" },
            ]}
          >
            Search for messages, threads, or contacts
          </Text>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  clearButton: {
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  resultsList: {
    flex: 1,
  },
  resultContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  resultItem: {
    flexDirection: "row",
    padding: 15,
  },
  resultIcon: {
    marginRight: 15,
    width: 40,
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },
});
