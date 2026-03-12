import apiClient from "../client/axios";
import { API_ENDPOINTS } from "../client/endpoints";
import type {
  BackupListItem,
  BackupPreflight,
  BackupRunStatus,
  BackupSettingPublic,
  LocalBackupKind,
  LocalStoredBackupItem,
  LocalStoreJobStatus,
  UpdateBackupSettingsBulkRequest,
} from "../types/backup.types";

export const backupService = {
  // ── Status & health ──────────────────────────────────────────────────────

  getStatus: async (): Promise<BackupRunStatus> => {
    const res = await apiClient.get<BackupRunStatus>(
      `${API_ENDPOINTS.BACKUP.BASE}/status`,
    );
    return res.data;
  },

  preflight: async (): Promise<BackupPreflight> => {
    const res = await apiClient.get<BackupPreflight>(
      `${API_ENDPOINTS.BACKUP.BASE}/preflight`,
    );
    return res.data;
  },

  // ── Settings ─────────────────────────────────────────────────────────────

  getSettings: async (): Promise<BackupSettingPublic[]> => {
    const res = await apiClient.get<BackupSettingPublic[]>(
      `${API_ENDPOINTS.BACKUP.BASE}/settings`,
    );
    return res.data;
  },

  updateSettingsBulk: async (
    data: UpdateBackupSettingsBulkRequest,
  ): Promise<{ message: string }> => {
    const res = await apiClient.patch<{ message: string }>(
      `${API_ENDPOINTS.BACKUP.BASE}/settings/bulk`,
      data,
    );
    return res.data;
  },

  // ── Cloud backup operations ───────────────────────────────────────────────

  manualBackup: async (reason?: string): Promise<{ runId: string }> => {
    const res = await apiClient.post<{ runId: string }>(
      `${API_ENDPOINTS.BACKUP.BASE}/manual`,
      { reason },
    );
    return res.data;
  },

  list: async (): Promise<BackupListItem[]> => {
    const res = await apiClient.get<BackupListItem[]>(
      `${API_ENDPOINTS.BACKUP.BASE}/list`,
    );
    return res.data;
  },

  restore: async (
    runId: string,
    adminPassword: string,
  ): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(
      `${API_ENDPOINTS.BACKUP.BASE}/restore`,
      { runId, adminPassword },
    );
    return res.data;
  },

  forceReset: async (): Promise<{ reset: boolean; clearedRuns: number }> => {
    const res = await apiClient.post<{ reset: boolean; clearedRuns: number }>(
      `${API_ENDPOINTS.BACKUP.BASE}/reset`,
    );
    return res.data;
  },

  // ── LOCAL BACKUP────────────────────────────────────────────────────

  /**
   * Download a local backup ZIP directly to the user's machine.
   *
   * Calls GET /backup/local/download with the JWT Bearer token,
   * receives a binary blob, then triggers a browser Save-As download.
   *
   * The request may take several minutes for large databases — a 10-minute
   * timeout is applied.
   */
  downloadLocalBackup: async (): Promise<void> => {
    const response = await apiClient.get(API_ENDPOINTS.BACKUP.LOCAL_DOWNLOAD, {
      responseType: "blob",
      timeout: 10 * 60 * 1000, // 10 minutes
    });

    // Try to use the server-provided filename from Content-Disposition
    const disposition =
      (response.headers["content-disposition"] as string | undefined) ?? "";
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n;]+)\1/);
    const filename =
      match?.[2] ??
      `local-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

    const blob = new Blob([response.data as BlobPart], {
      type: "application/zip",
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup after a short delay (browser needs time to initiate download)
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 200);
  },

  /**
   * Restore from a previously downloaded local-backup ZIP.
   *
   * Sends as multipart/form-data:
   *   file          — the .zip file
   *   adminPassword — the admin's current password (double-confirmation)
   *
   * NOTE: axios automatically sets the correct Content-Type boundary
   * when you pass a FormData object — do NOT set Content-Type manually.
   */
  restoreFromLocalZip: async (
    file: File,
    adminPassword: string,
  ): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("adminPassword", adminPassword);

    const res = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.BACKUP.LOCAL_RESTORE,
      formData,
      {
        timeout: 10 * 60 * 1000, // 10 minutes for large restores
        // Do NOT set Content-Type — axios handles multipart boundary automatically
      },
    );
    return res.data;
  },

  verifyAdminPassword: async (adminPassword: string): Promise<{ ok: true }> => {
    const res = await apiClient.post<{ ok: true }>(
      API_ENDPOINTS.BACKUP.LOCAL_VERIFY_PASSWORD,
      { adminPassword },
    );
    return res.data;
  },

  createLocalStoredBackup: async (
    kind: LocalBackupKind,
  ): Promise<{ jobId: string }> => {
    const res = await apiClient.post<{ jobId: string }>(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_CREATE,
      { kind },
    );
    return res.data;
  },

  getLocalStoredBackupStatus: async (
    jobId: string,
  ): Promise<LocalStoreJobStatus> => {
    const res = await apiClient.get<LocalStoreJobStatus>(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_STATUS(jobId),
    );
    return res.data;
  },

  listLocalStoredBackups: async (): Promise<LocalStoredBackupItem[]> => {
    const res = await apiClient.get<LocalStoredBackupItem[]>(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_LIST,
    );
    return res.data;
  },

  downloadLocalStoredBackup: async (fileName: string): Promise<void> => {
    const res = await apiClient.get(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_DOWNLOAD(fileName),
      { responseType: "blob", timeout: 10 * 60 * 1000 },
    );

    const blob = new Blob([res.data as BlobPart], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 200);
  },

  deleteLocalStoredBackup: async (
    fileName: string,
  ): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete<{ deleted: boolean }>(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_DELETE(fileName),
    );
    return res.data;
  },

  restoreLocalStoredBackup: async (
    fileName: string,
    adminPassword: string,
  ): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.BACKUP.LOCAL_STORE_RESTORE,
      { fileName, adminPassword },
    );
    return res.data;
  },

  deleteCloudRun: async (runId: string): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete<{ deleted: boolean }>(
      API_ENDPOINTS.BACKUP.CLOUD_DELETE_RUN(runId),
    );
    return res.data;
  },
};
