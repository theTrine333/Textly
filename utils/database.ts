import type { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from "expo-sqlite";

export interface IMessage {
  id?: number;
  address: string;
  body: string;
  date: string;
  type: number;
  read: number;
  seen: number;
  subscriptionId: number;
}

export class Database {
  private db!: SQLiteDatabase;

  constructor() {
    this.init();
  }

  private async init() {
    this.db = await SQLite.openDatabaseAsync("textly.db");

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        body TEXT NOT NULL,
        date TEXT NOT NULL,
        type INTEGER NOT NULL,
        read INTEGER NOT NULL,
        seen INTEGER NOT NULL,
        subscriptionId INTEGER NOT NULL
      );
    `);
  }

  async insertMessage(message: IMessage): Promise<void> {
    const { address, body, date, type, read, seen, subscriptionId } = message;

    await this.db.runAsync(
      `
      INSERT INTO messages (
        address, body, date, type, read, seen, subscriptionId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [address, body, date, type, read, seen, subscriptionId]
    );
  }

  async getAllMessages(): Promise<IMessage[]> {
    const messages = await this.db.getAllAsync<IMessage>(
      `SELECT * FROM messages ORDER BY id DESC`
    );
    return messages;
  }

  async clearMessages(): Promise<void> {
    await this.db.runAsync(`DELETE FROM messages`);
  }

  async deleteMessageById(id: number): Promise<void> {
    await this.db.runAsync(`DELETE FROM messages WHERE id = ?`, [id]);
  }

  async getMessagesByAddress(address: string): Promise<IMessage[]> {
    const messages = await this.db.getAllAsync<IMessage>(
      `SELECT * FROM messages WHERE address = ? ORDER BY id DESC`,
      [address]
    );
    return messages;
  }

  async getMessageCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages`
    );
    return result?.count ?? 0;
  }
}
