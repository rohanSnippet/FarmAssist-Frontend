// ==========================================
// FarmAssist IndexedDB
// Offline Request Queue
// ==========================================

const DB_NAME = "FarmAssistOfflineDB";
const DB_VERSION = 5;

export const SCAN_STORE = "offline_scan_queue";
export const COMMUNITY_STORE = "community_outbox";

// ==========================================
// INITIALIZE DATABASE
// ==========================================

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      console.log(
        `IndexedDB upgrade: ${event.oldVersion} -> ${event.newVersion}`,
      );

      // --------------------------------------
      // Offline Crop Detection Queue
      // --------------------------------------

      if (!db.objectStoreNames.contains(SCAN_STORE)) {
        const store = db.createObjectStore(SCAN_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("status", "status", { unique: false });

        store.createIndex("createdAt", "createdAt", { unique: false });

        console.log(`Created store: ${SCAN_STORE}`);
      }

      // --------------------------------------
      // Community Outbox
      // --------------------------------------

      if (!db.objectStoreNames.contains(COMMUNITY_STORE)) {
        const store = db.createObjectStore(COMMUNITY_STORE, {
          keyPath: "id",
        });

        store.createIndex("timestamp", "timestamp", { unique: false });

        console.log(`Created store: ${COMMUNITY_STORE}`);
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      console.log("IndexedDB opened:", db.name, db.version);

      console.log("Stores:", [...db.objectStoreNames]);

      // Allow future DB upgrades from another tab
      db.onversionchange = () => {
        db.close();
      };

      resolve(db);
    };

    request.onerror = () => {
      console.error("IndexedDB open failed:", request.error);

      reject(request.error);
    };

    request.onblocked = () => {
      console.warn("IndexedDB upgrade blocked. Close other FarmAssist tabs.");
    };
  });
};

// ==========================================
// SAVE COMPLETE CROP DETECTION REQUEST
// ==========================================

export const saveDetectionRequest = async ({ imageFile, farmId, language }) => {
  if (!imageFile) {
    throw new Error("Cannot queue detection request without image.");
  }

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readwrite");

    const store = transaction.objectStore(SCAN_STORE);

    /*
     * IMPORTANT:
     *
     * We don't store FormData directly.
     *
     * Instead, we store every field needed to
     * reconstruct the FormData later.
     *
     * File/Blob objects are supported by IndexedDB.
     */

    const record = {
      // Request type
      type: "CROP_DETECTION",

      // Current state of the request
      status: "PENDING_SCAN",

      // -------------------------------
      // /api/scan/
      // -------------------------------

      scanRequest: {
        endpoint: "/api/scan/",
        method: "POST",

        imageFile: imageFile,

        language: language || "en",
      },

      // -------------------------------
      // /api/detections/
      // -------------------------------

      detectionRequest: {
        endpoint: "/api/detections/",
        method: "POST",

        farmId: farmId || "unlinked",
      },

      // -------------------------------
      // Metadata
      // -------------------------------

      createdAt: new Date().toISOString(),

      retryCount: 0,
    };

    console.log("QUEUEING COMPLETE DETECTION REQUEST:", record);

    const request = store.add(record);

    request.onsuccess = () => {
      console.log("Detection request queued. ID:", request.result);
    };

    request.onerror = () => {
      console.error("Failed to queue detection request:", request.error);

      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve(request.result);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error || new Error("IndexedDB transaction aborted."));
    };
  });
};

// ==========================================
// GET ALL QUEUED DETECTION REQUESTS
// ==========================================

export const getDetectionRequests = async () => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readonly");

    const store = transaction.objectStore(SCAN_STORE);

    const request = store.getAll();

    request.onsuccess = () => {
      console.log("Queued detection requests:", request.result);

      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// ==========================================
// GET ONE REQUEST
// ==========================================

export const getDetectionRequest = async (id) => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readonly");

    const store = transaction.objectStore(SCAN_STORE);

    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// ==========================================
// UPDATE QUEUED REQUEST
// ==========================================

export const updateDetectionRequest = async (id, updates) => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readwrite");

    const store = transaction.objectStore(SCAN_STORE);

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;

      if (!existing) {
        reject(new Error(`Queue item ${id} not found.`));
        return;
      }

      const updated = {
        ...existing,
        ...updates,
      };

      const putRequest = store.put(updated);

      putRequest.onerror = () => {
        reject(putRequest.error);
      };

      putRequest.onsuccess = () => {
        console.log("Queue item updated:", id);
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};

// ==========================================
// REMOVE SUCCESSFULLY SYNCED REQUEST
// ==========================================

export const removeDetectionRequest = async (id) => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readwrite");

    const store = transaction.objectStore(SCAN_STORE);

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;

      if (!existing) {
        console.warn(`Detection request ${id} was already removed.`);

        resolve(true);
        return;
      }

      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => {
        console.log("Detection request deleted from IndexedDB:", id);
      };

      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(
        transaction.error || new Error("IndexedDB delete transaction aborted."),
      );
    };
  });
};

// ==========================================
// COUNT QUEUED REQUESTS
// ==========================================

export const getDetectionQueueCount = async () => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readonly");

    const store = transaction.objectStore(SCAN_STORE);

    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// ==========================================
// CLEAR DETECTION QUEUE
// ==========================================

export const clearDetectionQueue = async () => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SCAN_STORE, "readwrite");

    const store = transaction.objectStore(SCAN_STORE);

    const request = store.clear();

    request.onsuccess = () => {
      console.log("Detection queue cleared.");
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};

// ==========================================
// BACKWARD COMPATIBILITY
// ==========================================

export const saveToOutbox = async (data) => {
  return saveDetectionRequest({
    imageFile: data.imageFile,
    farmId: data.farmId,
    language: data.language,
  });
};

export const getOutbox = async () => {
  return getDetectionRequests();
};

export const removeFromOutbox = async (id) => {
  return removeDetectionRequest(id);
};

// ==========================================
// COMMUNITY METHODS
// ==========================================

const generateKey = async () => {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
};

export const savePostOffline = async (postData) => {
  const db = await initDB();

  const key = await generateKey();

  const encoder = new TextEncoder();

  const encodedData = encoder.encode(JSON.stringify(postData));

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encodedData,
  );

  const exportedKey = await window.crypto.subtle.exportKey("jwk", key);

  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

  const record = {
    id,

    encryptedPayload: encryptedData,

    iv,

    cryptoKey: exportedKey,

    timestamp: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMUNITY_STORE, "readwrite");

    const store = transaction.objectStore(COMMUNITY_STORE);

    const request = store.add(record);

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve(id);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};

export const getOfflinePosts = async () => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMUNITY_STORE, "readonly");

    const store = transaction.objectStore(COMMUNITY_STORE);

    const request = store.getAll();

    request.onsuccess = async () => {
      const posts = [];

      for (const record of request.result) {
        try {
          const key = await window.crypto.subtle.importKey(
            "jwk",
            record.cryptoKey,
            {
              name: "AES-GCM",
            },
            true,
            ["encrypt", "decrypt"],
          );

          const decrypted = await window.crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: record.iv,
            },
            key,
            record.encryptedPayload,
          );

          const decoder = new TextDecoder();

          posts.push({
            offlineId: record.id,
            ...JSON.parse(decoder.decode(decrypted)),
          });
        } catch (error) {
          console.error("Community post decrypt failed:", error);
        }
      }

      resolve(posts);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const deleteOfflinePost = async (id) => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(COMMUNITY_STORE, "readwrite");

    const store = transaction.objectStore(COMMUNITY_STORE);

    const request = store.delete(id);

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};
