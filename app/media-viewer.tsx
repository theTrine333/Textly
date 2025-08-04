import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { MMSAttachment } from "../utils/database";
import { mmsService } from "../utils/mmsService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function MediaViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const attachmentId = params.attachmentId as string;
  const mmsId = params.mmsId as string;

  const [attachment, setAttachment] = useState<MMSAttachment | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attachments, setAttachments] = useState<MMSAttachment[]>([]);

  useEffect(() => {
    loadAttachment();
  }, [attachmentId, mmsId]);

  const loadAttachment = async () => {
    try {
      // Get all attachments for this MMS
      const allAttachments = await mmsService.getMMSAttachments(mmsId);
      setAttachments(allAttachments);

      // Find the current attachment
      const currentAttachment = allAttachments.find(
        (att) => att.id === attachmentId
      );
      if (currentAttachment) {
        setAttachment(currentAttachment);
        setCurrentIndex(
          allAttachments.findIndex((att) => att.id === attachmentId)
        );

        // Download attachment if needed
        if (!currentAttachment.path.startsWith("file://")) {
          setDownloading(true);
          try {
            const downloadedPath = await mmsService.downloadAttachment(
              currentAttachment
            );
            setLocalPath(downloadedPath);
          } catch (error) {
            console.error("Error downloading attachment:", error);
            Alert.alert("Error", "Failed to download attachment");
          } finally {
            setDownloading(false);
          }
        } else {
          setLocalPath(currentAttachment.path);
        }
      }
    } catch (error) {
      console.error("Error loading attachment:", error);
      Alert.alert("Error", "Failed to load attachment");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setAttachment(attachments[newIndex]);
      setLocalPath(null);
      loadAttachment();
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setAttachment(attachments[newIndex]);
      setLocalPath(null);
      loadAttachment();
    }
  };

  const handleShare = () => {
    if (attachment) {
      // Implement sharing functionality
      Alert.alert("Share", "Sharing feature coming soon!");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Attachment",
      "Are you sure you want to delete this attachment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Implement delete functionality
            Alert.alert("Delete", "Delete feature coming soon!");
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "videocam";
    if (contentType.startsWith("audio/")) return "musical-notes";
    return "document";
  };

  const renderMediaContent = () => {
    if (!attachment || !localPath) return null;

    const isImage = attachment.content_type.startsWith("image/");
    const isVideo = attachment.content_type.startsWith("video/");
    const isAudio = attachment.content_type.startsWith("audio/");

    if (isImage) {
      return (
        <Image
          source={{ uri: localPath }}
          style={styles.mediaContent}
          contentFit="contain"
          transition={200}
        />
      );
    }

    if (isVideo) {
      return (
        <Video
          source={{ uri: localPath }}
          style={styles.mediaContent}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      );
    }

    if (isAudio) {
      return (
        <View style={styles.audioContainer}>
          <Ionicons name="musical-notes" size={64} color="#007AFF" />
          <Text
            style={[
              styles.audioText,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Audio File
          </Text>
          <Text
            style={[
              styles.audioSubtext,
              { color: isDark ? "#cccccc" : "#666666" },
            ]}
          >
            {attachment.name || "Unknown"}
          </Text>
        </View>
      );
    }

    // Default for other file types
    return (
      <View style={styles.fileContainer}>
        <Ionicons name="document" size={64} color="#007AFF" />
        <Text
          style={[styles.fileText, { color: isDark ? "#ffffff" : "#000000" }]}
        >
          {attachment.name || "Unknown File"}
        </Text>
        <Text
          style={[
            styles.fileSubtext,
            { color: isDark ? "#cccccc" : "#666666" },
          ]}
        >
          {formatFileSize(attachment.size)}
        </Text>
      </View>
    );
  };

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

  if (!attachment) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#ffffff" },
        ]}
      >
        <Text
          style={[styles.errorText, { color: isDark ? "#ffffff" : "#000000" }]}
        >
          Attachment not found
        </Text>
      </View>
    );
  }

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

        <View style={styles.headerInfo}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            {attachment.name || "Attachment"}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#cccccc" : "#666666" },
            ]}
          >
            {formatFileSize(attachment.size)}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
            <Ionicons
              name="share-outline"
              size={24}
              color={isDark ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
            <Ionicons
              name="trash-outline"
              size={24}
              color={isDark ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Media Content */}
      <View style={styles.mediaContainer}>
        {downloading ? (
          <View style={styles.downloadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text
              style={[
                styles.downloadingText,
                { color: isDark ? "#ffffff" : "#000000" },
              ]}
            >
              Downloading...
            </Text>
          </View>
        ) : (
          renderMediaContent()
        )}
      </View>

      {/* Navigation Controls */}
      {attachments.length > 1 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            style={[
              styles.navButton,
              { opacity: currentIndex === 0 ? 0.5 : 1 },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.navigationText,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            {currentIndex + 1} of {attachments.length}
          </Text>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentIndex === attachments.length - 1}
            style={[
              styles.navButton,
              { opacity: currentIndex === attachments.length - 1 ? 0.5 : 1 },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={isDark ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* File Info */}
      <View
        style={[
          styles.infoContainer,
          { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
        ]}
      >
        <View style={styles.infoRow}>
          <Ionicons
            name={getFileTypeIcon(attachment.content_type)}
            size={20}
            color="#007AFF"
          />
          <Text
            style={[
              styles.infoLabel,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Type:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { color: isDark ? "#cccccc" : "#666666" },
            ]}
          >
            {attachment.content_type}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="resize" size={20} color="#007AFF" />
          <Text
            style={[
              styles.infoLabel,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Size:
          </Text>
          <Text
            style={[
              styles.infoValue,
              { color: isDark ? "#cccccc" : "#666666" },
            ]}
          >
            {formatFileSize(attachment.size)}
          </Text>
        </View>

        {attachment.name && (
          <View style={styles.infoRow}>
            <Ionicons name="document" size={20} color="#007AFF" />
            <Text
              style={[
                styles.infoLabel,
                { color: isDark ? "#ffffff" : "#000000" },
              ]}
            >
              Name:
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isDark ? "#cccccc" : "#666666" },
              ]}
            >
              {attachment.name}
            </Text>
          </View>
        )}
      </View>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerAction: {
    marginLeft: 15,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaContent: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  downloadingContainer: {
    alignItems: "center",
  },
  downloadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  audioContainer: {
    alignItems: "center",
    padding: 40,
  },
  audioText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  audioSubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  fileContainer: {
    alignItems: "center",
    padding: 40,
  },
  fileText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  fileSubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navButton: {
    padding: 10,
  },
  navigationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
  },
});
