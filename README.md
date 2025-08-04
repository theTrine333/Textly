# Textly - Advanced SMS/MMS Messaging App

A comprehensive Android SMS/MMS messaging application built with React Native and Expo, featuring advanced messaging capabilities, media support, and modern UI design.

## 🚀 Features

### ✅ SMS Functionality

- **Send SMS** (single and multipart messages)
- **Receive SMS** (foreground and background via BroadcastReceiver)
- **Mark as read/unread**
- **Delete SMS messages**
- **Search SMS** by content/sender/date
- **Show delivery status** (sent, delivered, failed)
- **Show sent time & received time**
- **Retry failed messages**
- **Show contact name** from phonebook (if available)

### ✅ MMS Functionality

- **Send MMS** with media (images, videos, audio)
- **Receive MMS** with attachments
- **Download MMS content** manually or automatically
- **Support for group MMS** (where MMS is used as group chat)
- **Show thumbnails** for media
- **Support for long subject/message fields**

### 📁 Message Management

- **Threaded conversations** (grouped by phone number/contact)
- **List all threads** with previews
- **Search across all threads**
- **Archive/unarchive threads**
- **Delete entire threads**
- **Support for dual SIM** (optional/advanced)

### 📲 App Integration Features

- **Make the app the default SMS app**
- **Register app to handle sms: and mms: links**
- **Read system SMS database** via ContentProvider
- **Backup/restore messages** (optional but great)

### 🔔 Notifications & Background Behavior

- **Push notifications** on new SMS/MMS
- **Custom notification sounds** per contact (optional)
- **Support silent mode/dnd detection**
- **Handle messages while app is backgrounded**
- **Show sender and message content** in notification
- **Quick reply from notification** (optional)

### 🛠 Developer & Diagnostic Features

- **Export logs** for debugging
- **Manual APN config screen** for custom MMS settings
- **Simulate message receive** (for testing)
- **Status debug panel** (permissions, default app status, etc.)

### 🧑‍🎨 User Experience Features

- **Emoji picker** with animated emoji support
- **Message bubble customization** (colors, shapes)
- **Light & dark themes**
- **Auto-link detection** (URLs, phone numbers, emails)
- **Media preview and full-view modal**
- **Typing indicator** (for group MMS or future IM features)

### 🛡️ Permissions & Privacy

- **Encrypted local storage** (optional)
- **User control over read receipts/delivery reports**
- **Clear data/history options**
- **Permission management UI**

### ⚙️ Settings Section

- **Notification preferences** (sound, vibration)
- **Auto-download MMS** (on Wi-Fi only, etc.)
- **Change bubble themes/colors**
- **Storage usage breakdown**
- **Block/blacklist senders**
- **Enable/disable delivery reports**
- **Choose default SIM** (if dual-SIM)

## 🛠 Technical Architecture

### SMS Implementation

The app uses a custom native Android module for SMS functionality, replacing the outdated `react-native-sms-android` package. The implementation includes:

- **Native Android SMS Module** (`SmsModule.java`) - Handles SMS sending using modern Android APIs
- **SMS Receiver** (`SmsReceiver.java`) - Handles incoming SMS messages
- **Dual SIM Support** - Supports multiple SIM cards with subscription-based SMS manager
- **Delivery Status Tracking** - Real-time delivery status updates via BroadcastReceivers
- **Permission Management** - Comprehensive permission handling for SMS operations

### Database Schema

The app uses SQLite with the following main tables:

- `sms_messages` - SMS message storage
- `mms_messages` - MMS message storage
- `mms_attachments` - MMS media attachments
- `threads` - Conversation threads
- `contacts` - Contact information
- `settings` - App configuration

### Core Services

- **SMS Service** - Handles SMS sending/receiving and delivery status
- **MMS Service** - Manages multimedia messages and attachments
- **Database Service** - SQLite operations and data management
- **Notification Service** - Push notifications and alerts

### Key Components

- **Home Screen** - Thread list with bottom navigation
- **Conversation Screen** - Chat interface with message bubbles
- **Compose Screen** - New message creation with contact selection
- **Settings Screen** - App configuration and preferences
- **Search Screen** - Global search across messages/threads/contacts
- **Media Viewer** - Full-screen media attachment viewing

## 📱 Screenshots

The app features a modern, clean interface with:

- Dark/light theme support
- Intuitive navigation
- Message bubbles with delivery status
- Media attachment previews
- Contact integration
- Advanced search capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Physical Android device (for SMS/MMS testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Textly
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on Android device**
   ```bash
   npm run android
   ```

### Required Permissions

The app requires the following Android permissions:

- `SEND_SMS` - Send SMS messages
- `READ_SMS` - Read SMS messages
- `RECEIVE_SMS` - Receive SMS messages
- `WRITE_SMS` - Write SMS messages
- `READ_CONTACTS` - Access contacts
- `READ_PHONE_STATE` - Phone state access
- `READ_PHONE_NUMBERS` - Phone number access
- `CAMERA` - Camera access for media
- `READ_EXTERNAL_STORAGE` - File system access
- `WRITE_EXTERNAL_STORAGE` - File system write access
- `ACCESS_NETWORK_STATE` - Network state
- `INTERNET` - Internet access
- `POST_NOTIFICATIONS` - Push notifications

### Configuration

1. **Set as Default SMS App**

   - The app will prompt to be set as the default SMS app
   - This is required for full SMS/MMS functionality

2. **Grant Permissions**

   - The app will request necessary permissions on first launch
   - All permissions must be granted for full functionality

3. **Configure MMS Settings**
   - Access Settings > MMS Settings to configure APN
   - Enable auto-download for MMS attachments

## 🔧 Development

### Project Structure

```
Textly/
├── app/                    # Main app screens
│   ├── index.tsx          # Home screen
│   ├── conversation.tsx   # Chat screen
│   ├── compose.tsx        # New message screen
│   ├── settings.tsx       # Settings screen
│   ├── search.tsx         # Search screen
│   └── media-viewer.tsx   # Media viewer
├── utils/                 # Core services
│   ├── database.ts        # Database schema and operations
│   ├── smsService.ts      # SMS functionality
│   └── mmsService.ts      # MMS functionality
├── android/               # Native Android code
│   └── app/src/main/java/com/tesla254/Textly/
│       ├── SmsModule.java     # Native SMS module
│       ├── SmsReceiver.java   # SMS receiver
│       ├── SmsPackage.java    # Package registration
│       └── MainApplication.java # App entry point
├── components/            # Reusable components
└── assets/               # Images and resources
```

### Key Dependencies

- `expo-sqlite` - Database management
- `expo-contacts` - Contact integration
- `expo-notifications` - Push notifications
- `expo-media-library` - Media access
- `expo-image-picker` - Media selection
- `expo-file-system` - File operations
- `react-native-device-info` - Device information
- Custom native Android SMS module - Modern SMS functionality

### Testing

1. **SMS Testing**

   - Use a physical Android device
   - Test sending/receiving SMS messages
   - Verify delivery status tracking

2. **MMS Testing**

   - Test media attachment sending
   - Verify MMS receiving and downloading
   - Test group MMS functionality

3. **Permission Testing**
   - Test all permission scenarios
   - Verify graceful handling of denied permissions

## 🚀 Future Enhancements

### Planned Features

- **RCS Support** - Rich Communication Services
- **Cloud Backup** - Google Drive/Dropbox integration
- **Scheduled Messages** - Send messages at specific times
- **Message Encryption** - End-to-end encryption
- **Advanced Search** - AI-powered search capabilities
- **Custom Themes** - User-defined color schemes
- **Message Reactions** - Like/react to messages
- **Voice Messages** - Audio message support

### Advanced Features

- **RCS Integration** - Rich messaging features
- **Cloud Sync** - Cross-device message sync
- **Message Encryption** - Enhanced security
- **AI Assistant** - Smart reply suggestions
- **Advanced Analytics** - Usage statistics
- **Custom Stickers** - Personal sticker packs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the excellent development platform
- React Native community for the robust framework
- Android SMS/MMS APIs for messaging capabilities
- Contributors and testers for feedback and improvements

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Note**: This app requires Android permissions and should be tested on physical devices for full SMS/MMS functionality. Some features may not work in emulators.
