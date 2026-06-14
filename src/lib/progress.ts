import { sessionVideoProgress } from "./constant";
const MAX_BOOK_PROGRESS = 10
/**
 * 进度 LRU 缓存
 */
class ProgressLRUCache<T = any> {
  private map: Map<string, T>;
  private maxSize: number;
  private storageKey: string;
  private storage: Storage | null;

  constructor(maxSize: number, storageKey: string) {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.storage = typeof window === "undefined" ? null : window.sessionStorage;
    this.map = new Map();
    this.loadFromStorage();
  }
  /**
   * 从 sessionStorage 加载数据并反序列化到 Map
   */
  private loadFromStorage() {
    if (!this.storage) return;
    try {
      const stored = this.storage.getItem(this.storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        this.map = new Map(parsed);
        this.trimIfNeeded();
      }
    } catch (error) {
      console.warn("Failed to load progress from storage:", error);
      this.map = new Map();
    }
  }
  /**
   * 将当前 Map 缓存序列化为数组，并保存到 sessionStorage
   */
  private saveToStorage() {
    if (!this.storage) return;
    try {
      const data = JSON.stringify(Array.from(this.map.entries()));
      this.storage.setItem(this.storageKey, data);
    } catch (error) {
      console.warn("Failed to save progress to storage:", error);
    }
  }
  /**
   * 如果缓存数量超过限制，则删除最旧的条目
   */
  private trimIfNeeded() {
    while (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value || "";
      this.map.delete(firstKey);
    }
  }

  set(key: string, value: T) {
    this.map.delete(key);
    this.map.set(key, value);
    this.trimIfNeeded();
    this.saveToStorage();
  }

  get(key: string): T | null {
    if (!this.map.has(key)) return null;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    this.saveToStorage();
    return value;
  }
}

export const progressCache = new ProgressLRUCache<any>(MAX_BOOK_PROGRESS, sessionVideoProgress);