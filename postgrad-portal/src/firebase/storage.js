// ============================================
// Firebase Storage Service
// Upload, download, delete files
// ============================================

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage.
 * @param {File} file – browser File object
 * @param {string} path – storage path, e.g. 'requests/req-001/proposal.pdf'
 * @returns {Promise<{url: string, path: string, name: string, size: number}>}
 */
export async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return {
    url,
    path,
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
 * Get download URL for a storage path.
 */
export async function getFileUrl(path) {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * Upload a generated PDF blob.
 * @param {Blob} blob – PDF blob
 * @param {string} path – storage path
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadPdfBlob(blob, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}
