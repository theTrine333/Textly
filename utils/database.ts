import * as SQLite from "expo-sqlite";

export interface SMSMessage {
  id: string;
  thread_id: string;
  address: string;
  contact_name?: string;
  body: string;
  type: "inbox" | "sent" | "draft" | "outbox" | "failed" | "queued";
  read: boolean;
  date: number;
  date_sent: number;
  delivery_status: "pending" | "sent" | "delivered" | "failed";
  sim_slot?: number;
  mms?: boolean;
  subject?: string;
  attachment_count?: number;
  created_at: number;
  updated_at: number;
}

export interface MMSMessage {
  id: string;
  thread_id: string;
  address: string;
  contact_name?: string;
  subject?: string;
  body: string;
  type: "inbox" | "sent" | "draft" | "outbox" | "failed" | "queued";
  read: boolean;
  date: number;
  date_sent: number;
  delivery_status: "pending" | "sent" | "delivered" | "failed";
  sim_slot?: number;
  attachment_count: number;
  created_at: number;
  updated_at: number;
}

export interface MMSAttachment {
  id: string;
  mms_id: string;
  content_type: string;
  name?: string;
  size: number;
  path: string;
  thumbnail_path?: string;
  created_at: number;
}

export interface Thread {
  id: string;
  address: string;
  contact_name?: string;
  snippet: string;
  message_count: number;
  unread_count: number;
  date: number;
  type: "sms" | "mms";
  archived: boolean;
  pinned: boolean;
  created_at: number;
  updated_at: number;
}

export interface Contact {
  id: string | any;
  name: string;
  phone_numbers: string[] | any;
  avatar?: string;
  created_at: number;
  updated_at: number;
}

export interface Settings {
  key: string;
  value: string;
  updated_at: number;
}

class Database {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseAsync("textly.db");
    this.init();
  }

  private init() {
    this.db.transaction((tx) => {
      // SMS Messages table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS sms_messages (
          id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL,
          address TEXT NOT NULL,
          contact_name TEXT,
          body TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'inbox',
          read INTEGER DEFAULT 0,
          date INTEGER NOT NULL,
          date_sent INTEGER,
          delivery_status TEXT DEFAULT 'pending',
          sim_slot INTEGER,
          mms INTEGER DEFAULT 0,
          subject TEXT,
          attachment_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // MMS Messages table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS mms_messages (
          id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL,
          address TEXT NOT NULL,
          contact_name TEXT,
          subject TEXT,
          body TEXT,
          type TEXT NOT NULL DEFAULT 'inbox',
          read INTEGER DEFAULT 0,
          date INTEGER NOT NULL,
          date_sent INTEGER,
          delivery_status TEXT DEFAULT 'pending',
          sim_slot INTEGER,
          attachment_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // MMS Attachments table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS mms_attachments (
          id TEXT PRIMARY KEY,
          mms_id TEXT NOT NULL,
          content_type TEXT NOT NULL,
          name TEXT,
          size INTEGER NOT NULL,
          path TEXT NOT NULL,
          thumbnail_path TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (mms_id) REFERENCES mms_messages (id) ON DELETE CASCADE
        )
      `);

      // Threads table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS threads (
          id TEXT PRIMARY KEY,
          address TEXT NOT NULL,
          contact_name TEXT,
          snippet TEXT,
          message_count INTEGER DEFAULT 0,
          unread_count INTEGER DEFAULT 0,
          date INTEGER NOT NULL,
          type TEXT DEFAULT 'sms',
          archived INTEGER DEFAULT 0,
          pinned INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // Contacts table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone_numbers TEXT NOT NULL,
          avatar TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // Settings table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // Create indexes for better performance
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_sms_thread_id ON sms_messages (thread_id)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_sms_address ON sms_messages (address)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_sms_date ON sms_messages (date)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_mms_thread_id ON mms_messages (thread_id)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_mms_address ON mms_messages (address)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_mms_date ON mms_messages (date)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_threads_address ON threads (address)"
      );
      tx.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_threads_date ON threads (date)"
      );
    });
  }

  // SMS Methods
  async insertSMS(sms: SMSMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO sms_messages 
           (id, thread_id, address, contact_name, body, type, read, date, date_sent, 
            delivery_status, sim_slot, mms, subject, attachment_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sms.id,
            sms.thread_id,
            sms.address,
            sms.contact_name,
            sms.body,
            sms.type,
            sms.read ? 1 : 0,
            sms.date,
            sms.date_sent,
            sms.delivery_status,
            sms.sim_slot,
            sms.mms ? 1 : 0,
            sms.subject,
            sms.attachment_count,
            sms.created_at,
            sms.updated_at,
          ],
          () => resolve(),
          (_: any, error: any) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getSMSByThread(
    threadId: string,
    limit = 50,
    offset = 0
  ): Promise<SMSMessage[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM sms_messages 
           WHERE thread_id = ? 
           ORDER BY date DESC 
           LIMIT ? OFFSET ?`,
          [threadId, limit, offset],
          (_, { rows }) => {
            const messages = rows._array.map((row) => ({
              ...row,
              read: Boolean(row.read),
              mms: Boolean(row.mms),
            }));
            resolve(messages);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async searchSMS(query: string): Promise<SMSMessage[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM sms_messages 
           WHERE body LIKE ? OR address LIKE ? OR contact_name LIKE ?
           ORDER BY date DESC`,
          [`%${query}%`, `%${query}%`, `%${query}%`],
          (_, { rows }) => {
            const messages = rows._array.map((row) => ({
              ...row,
              read: Boolean(row.read),
              mms: Boolean(row.mms),
            }));
            resolve(messages);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateSMSDeliveryStatus(id: string, status: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "UPDATE sms_messages SET delivery_status = ?, updated_at = ? WHERE id = ?",
          [status, Date.now(), id],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // MMS Methods
  async insertMMS(mms: MMSMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO mms_messages 
           (id, thread_id, address, contact_name, subject, body, type, read, date, 
            date_sent, delivery_status, sim_slot, attachment_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mms.id,
            mms.thread_id,
            mms.address,
            mms.contact_name,
            mms.subject,
            mms.body,
            mms.type,
            mms.read ? 1 : 0,
            mms.date,
            mms.date_sent,
            mms.delivery_status,
            mms.sim_slot,
            mms.attachment_count,
            mms.created_at,
            mms.updated_at,
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async insertMMSAttachment(attachment: MMSAttachment): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO mms_attachments 
           (id, mms_id, content_type, name, size, path, thumbnail_path, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attachment.id,
            attachment.mms_id,
            attachment.content_type,
            attachment.name,
            attachment.size,
            attachment.path,
            attachment.thumbnail_path,
            attachment.created_at,
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getMMSAttachments(mmsId: string): Promise<MMSAttachment[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM mms_attachments WHERE mms_id = ? ORDER BY created_at ASC",
          [mmsId],
          (_, { rows }) => resolve(rows._array),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Thread Methods
  async insertThread(thread: Thread): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO threads 
           (id, address, contact_name, snippet, message_count, unread_count, date, 
            type, archived, pinned, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            thread.id,
            thread.address,
            thread.contact_name,
            thread.snippet,
            thread.message_count,
            thread.unread_count,
            thread.date,
            thread.type,
            thread.archived ? 1 : 0,
            thread.pinned ? 1 : 0,
            thread.created_at,
            thread.updated_at,
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAllThreads(): Promise<Thread[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM threads 
           ORDER BY pinned DESC, date DESC`,
          [],
          (_, { rows }) => {
            const threads = rows._array.map((row) => ({
              ...row,
              archived: Boolean(row.archived),
              pinned: Boolean(row.pinned),
            }));
            resolve(threads);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async searchThreads(query: string): Promise<Thread[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM threads 
           WHERE address LIKE ? OR contact_name LIKE ? OR snippet LIKE ?
           ORDER BY date DESC`,
          [`%${query}%`, `%${query}%`, `%${query}%`],
          (_, { rows }) => {
            const threads = rows._array.map((row) => ({
              ...row,
              archived: Boolean(row.archived),
              pinned: Boolean(row.pinned),
            }));
            resolve(threads);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Contact Methods
  async insertContact(contact: Contact): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO contacts 
           (id, name, phone_numbers, avatar, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            contact.id,
            contact.name,
            JSON.stringify(contact.phone_numbers),
            contact.avatar,
            contact.created_at,
            contact.updated_at,
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getContactByPhone(phoneNumber: string): Promise<Contact | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM contacts WHERE phone_numbers LIKE ?",
          [`%${phoneNumber}%`],
          (_, { rows }) => {
            if (rows._array.length > 0) {
              const contact = rows._array[0];
              contact.phone_numbers = JSON.parse(contact.phone_numbers);
              resolve(contact);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Settings Methods
  async setSetting(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
          [key, value, Date.now()],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          "SELECT value FROM settings WHERE key = ?",
          [key],
          (_, { rows }) => {
            if (rows._array.length > 0) {
              resolve(rows._array[0].value);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Utility Methods
  async deleteThread(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql("DELETE FROM sms_messages WHERE thread_id = ?", [
          threadId,
        ]);
        tx.executeSql("DELETE FROM mms_messages WHERE thread_id = ?", [
          threadId,
        ]);
        tx.executeSql("DELETE FROM threads WHERE id = ?", [threadId], () =>
          resolve()
        );
      });
    });
  }

  async markThreadAsRead(threadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql("UPDATE sms_messages SET read = 1 WHERE thread_id = ?", [
          threadId,
        ]);
        tx.executeSql("UPDATE mms_messages SET read = 1 WHERE thread_id = ?", [
          threadId,
        ]);
        tx.executeSql(
          "UPDATE threads SET unread_count = 0 WHERE id = ?",
          [threadId],
          () => resolve()
        );
      });
    });
  }
}

export const database = new Database();
