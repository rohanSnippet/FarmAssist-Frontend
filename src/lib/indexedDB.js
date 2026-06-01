const DB_NAME = "FarmAssistOfflineDB";
const SCAN_STORE = "scan_outbox";
const COMMUNITY_STORE = "community_outbox";
const DB_VERSION = 2; // Incremented for upgrade

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Existing scan store
      if (!db.objectStoreNames.contains(SCAN_STORE)) {
        db.createObjectStore(SCAN_STORE, { keyPath: "id", autoIncrement: true });
      }
      // New encrypted community store
      if (!db.objectStoreNames.contains(COMMUNITY_STORE)) {
        db.createObjectStore(COMMUNITY_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Save a pending scan/broadcast to the outbox
export const saveToOutbox = async (data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(data);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Retrieve all pending outbox items
export const getOutbox = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Remove an item from the outbox after successful sync
export const removeFromOutbox = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

//==========================================
// SECURE COMMUNITY FEED METHODS (AES-GCM)
// ==========================================

const generateKey = async () => {
    return await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
};

export const savePostOffline = async (postData) => {
    const db = await initDB();
    const key = await generateKey();
    
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(postData));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, key, encodedData
    );
    const exportedKey = await window.crypto.subtle.exportKey("jwk", key);

    const offlineRecord = {
        id: Date.now().toString(),
        encryptedPayload: encryptedData,
        iv: iv,
        cryptoKey: exportedKey,
        timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(COMMUNITY_STORE, "readwrite");
        const store = transaction.objectStore(COMMUNITY_STORE);
        const request = store.add(offlineRecord);
        request.onsuccess = () => resolve(offlineRecord.id);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const getOfflinePosts = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(COMMUNITY_STORE, "readonly");
        const store = transaction.objectStore(COMMUNITY_STORE);
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const decryptedPosts = [];
            for (let record of request.result) {
                try {
                    const key = await window.crypto.subtle.importKey(
                        "jwk", record.cryptoKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]
                    );
                    const decryptedBuffer = await window.crypto.subtle.decrypt(
                        { name: "AES-GCM", iv: record.iv }, key, record.encryptedPayload
                    );
                    const decoder = new TextDecoder();
                    decryptedPosts.push({ offlineId: record.id, ...JSON.parse(decoder.decode(decryptedBuffer)) });
                } catch (e) {
                    console.error("Decrypt failed", e);
                }
            }
            resolve(decryptedPosts);
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

export const deleteOfflinePost = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(COMMUNITY_STORE, "readwrite");
        const store = transaction.objectStore(COMMUNITY_STORE);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
};