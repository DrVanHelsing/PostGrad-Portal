// ============================================
// Local Storage Adapter (No Firebase Storage)
// Upload, resolve, delete files for local/demo mode
// ============================================

const inMemoryFiles = new Map();
const DB_NAME = 'postgrad-portal-local-files';
const STORE_NAME = 'files';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlob(path, blob) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getBlob(path) {
  const db = await openDb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(path);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

async function removeBlob(path) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function normalizePath(path) {
  if (!path) return '';
  return path.startsWith('/') ? path.slice(1) : path;
}

function toPublicUrl(path) {
  const normalized = normalizePath(path);
  return normalized ? `/${normalized}` : '';
}

async function isLikelyValidPdfBlob(blob) {
  if (!(blob instanceof Blob) || blob.size < 8) return false;

  const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const hasPdfHeader =
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d; // -

  return hasPdfHeader;
}

async function isLikelyValidPdfBlobUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return isLikelyValidPdfBlob(blob);
  } catch {
    return false;
  }
}

/**
 * Upload a file (local adapter).
 * @param {File} file – browser File object
 * @param {string} path – pseudo storage path, e.g. 'requests/req-001/proposal.pdf'
 * @returns {Promise<{url: string, path: string, name: string, size: number}>}
 */
export async function uploadFile(file, path) {
  const normalizedPath = normalizePath(path);
  const blob = file instanceof Blob ? file : new Blob([file]);
  await putBlob(normalizedPath, blob);
  const url = URL.createObjectURL(blob);
  inMemoryFiles.set(normalizedPath, url);
  return {
    url,
    path: normalizedPath,
    name: file.name,
    size: file.size,
    contentType: file.type,
    uploadedAt: new Date(),
  };
}

/**
 * Upload multiple files for an HD request.
 * @param {File[]} files – array of browser File objects
 * @param {string} requestId – the HD request document ID
 * @param {string} subfolder – 'submission' | 'review' | 'final'
 * @returns {Promise<Array>} array of file metadata objects
 */
export async function uploadRequestFiles(files, requestId, subfolder = 'submission') {
  const results = [];
  for (const file of files) {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `requests/${requestId}/${subfolder}/${safeName}`;
    const meta = await uploadFile(file, path);
    results.push(meta);
  }
  return results;
}

/**
 * Get URL for a path.
 * Supports:
 * - absolute http(s)/blob/data urls (returned as-is)
 * - in-memory uploaded files (object URL)
 * - local public files under /documents or other static paths
 */
export async function getFileUrl(path) {
  if (!path) throw new Error('File path is required');
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  const normalizedPath = normalizePath(path);
  const isPdfPath = normalizedPath.toLowerCase().endsWith('.pdf');

  if (inMemoryFiles.has(normalizedPath)) {
    const cachedUrl = inMemoryFiles.get(normalizedPath);

    if (isPdfPath && cachedUrl?.startsWith('blob:')) {
      const valid = await isLikelyValidPdfBlobUrl(cachedUrl);
      if (!valid) {
        URL.revokeObjectURL(cachedUrl);
        inMemoryFiles.delete(normalizedPath);
        await removeBlob(normalizedPath);
      } else {
        return cachedUrl;
      }
    } else {
      return cachedUrl;
    }
  }

  const persistedBlob = await getBlob(normalizedPath);
  if (persistedBlob) {
    if (isPdfPath) {
      const valid = await isLikelyValidPdfBlob(persistedBlob);
      if (!valid) {
        await removeBlob(normalizedPath);
        return toPublicUrl(normalizedPath);
      }
    }

    const url = URL.createObjectURL(persistedBlob);
    inMemoryFiles.set(normalizedPath, url);
    return url;
  }

  return toPublicUrl(normalizedPath);
}

/**
 * Delete a file from local adapter.
 */
export async function deleteFile(path) {
  const normalizedPath = normalizePath(path);
  const existing = inMemoryFiles.get(normalizedPath);
  if (existing && existing.startsWith('blob:')) {
    URL.revokeObjectURL(existing);
  }
  inMemoryFiles.delete(normalizedPath);
  await removeBlob(normalizedPath);
}

/**
 * Upload a generated PDF blob (local adapter).
 * @param {Blob} blob – PDF blob
 * @param {string} path – pseudo storage path
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadPdfBlob(blob, path) {
  const normalizedPath = normalizePath(path);
  await putBlob(normalizedPath, blob);
  const url = URL.createObjectURL(blob);
  inMemoryFiles.set(normalizedPath, url);
  return { url, path: normalizedPath };
}
