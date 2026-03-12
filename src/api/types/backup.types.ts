export type StorageTarget = "R2" | "DRIVE";
export type BackupStatus = "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
export type BackupTrigger = "CRON" | "MANUAL";

export type LocalBackupKind = "FULL" | "DB_ONLY" | "UPLOADS_ONLY";
export type RestoreMode = "AUTO" | "FULL" | "DB_ONLY" | "UPLOADS_ONLY";

export type LocalStoreJobStage =
  | "PENDING"
  | "DUMP_DB"
  | "ZIP"
  | "DONE"
  | "FAILED";

// ── Settings ─────────────────────────────────────────────────────────────────

export interface BackupSettingPublic {
  key: string;
  value: string | null;
  isSecret: boolean;
  isSet: boolean;
}

// ── Run items ─────────────────────────────────────────────────────────────────

export interface BackupItemInfo {
  fileName: string;
  sizeBytes?: number | null;
  r2Key?: string;
  driveFileId?: string;
}

export interface BackupListItem {
  runId: string;
  createdAt: string;
  finishedAt: string | null;
  status: BackupStatus;
  trigger: BackupTrigger;
  error: string | null;
  mysql?: BackupItemInfo;
  uploads?: BackupItemInfo;
  manifest?: BackupItemInfo;
}

// ── Status / health ───────────────────────────────────────────────────────────

export interface BackupRunStatus {
  running: boolean;
  currentRunId: string | null;
  runStartedAt: string | null;
}

export interface BackupPreflight {
  platform: string;
  mysqldumpAvailable: boolean;
  mysqlAvailable: boolean;
  tarAvailable: boolean;
  settingsValid: boolean;
  error?: string;
}

// ── Bulk settings update ──────────────────────────────────────────────────────

export interface UpdateBackupSettingItem {
  key: string;
  value?: string | null;
  isSecret?: boolean;
}

export interface UpdateBackupSettingsBulkRequest {
  items: UpdateBackupSettingItem[];
}

// ── Local backup ────────────────────────────────────────────────────────

export interface LocalBackupManifest {
  version: string;
  type: "LOCAL_BACKUP";
  createdAt: string;
  platform: string;
  dbName: string;
  contents: string[];
}

export interface LocalBackupUIState {
  downloading: boolean;
  restoring: boolean;
  restoreFile: File | null;
  restorePassword: string;
}

export interface LocalStoreJobStatus {
  jobId: string;
  kind: LocalBackupKind;
  stage: LocalStoreJobStage;
  percent: number;
  message?: string;
  fileName?: string;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface LocalStoredBackupItem {
  fileName: string;
  kind: LocalBackupKind;
  createdAt: string;
  sizeBytes: number;
}
