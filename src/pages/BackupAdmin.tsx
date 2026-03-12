import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { backupService } from "@/api/services/backup.service";
import type {
  BackupListItem,
  BackupPreflight,
  BackupRunStatus,
  BackupSettingPublic,
  StorageTarget,
} from "@/api/types/backup.types";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  HardDrive,
  Loader2,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  ShieldAlert,
  Upload,
  XCircle,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVal(settings: BackupSettingPublic[], key: string): string {
  return settings.find((x) => x.key === key)?.value ?? "";
}

function statusBadge(status: BackupListItem["status"]) {
  switch (status) {
    case "SUCCESS":
      return <Badge className="bg-green-100 text-green-800">✓ Success</Badge>;
    case "FAILED":
      return <Badge variant="destructive">✗ Failed</Badge>;
    case "RUNNING":
      return (
        <Badge className="bg-blue-100 text-blue-800 animate-pulse">
          ⟳ Running
        </Badge>
      );
    case "PENDING":
      return <Badge variant="outline">⋯ Pending</Badge>;
  }
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BackupAdmin() {
  const { user } = useAuth();

  // ── Page-level loading ────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [settings, setSettings] = useState<BackupSettingPublic[]>([]);
  const [runs, setRuns] = useState<BackupListItem[]>([]);
  const [runStatus, setRunStatus] = useState<BackupRunStatus>({
    running: false,
    currentRunId: null,
    runStartedAt: null,
  });
  const [preflight, setPreflight] = useState<BackupPreflight | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [restoringRunId, setRestoringRunId] = useState<string | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Settings form ─────────────────────────────────────────────────────
  const [cron, setCron] = useState("0 2 * * *");
  const [retentionDays, setRetentionDays] = useState("7");
  const [paths, setPaths] = useState('["uploads"]');
  const [targets, setTargets] = useState<StorageTarget[]>(["R2", "DRIVE"]);

  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("3306");
  const [dbUser, setDbUser] = useState("");
  const [dbName, setDbName] = useState("");
  const [dbPassword, setDbPassword] = useState("");

  const [r2Endpoint, setR2Endpoint] = useState("");
  const [r2Bucket, setR2Bucket] = useState("");
  const [r2Region, setR2Region] = useState("auto");
  const [r2Prefix, setR2Prefix] = useState("backups");
  const [r2AccessKey, setR2AccessKey] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");

  const [driveFolderName, setDriveFolderName] = useState("backups");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [driveServiceAccountJson, setDriveServiceAccountJson] = useState("");

  // ── Local backup state (NEW) ──────────────────────────────────────────
  const [localDownloading, setLocalDownloading] = useState(false);
  const [localRestoreFile, setLocalRestoreFile] = useState<File | null>(null);
  const [localRestorePassword, setLocalRestorePassword] = useState("");
  const [localRestoring, setLocalRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Secret status ─────────────────────────────────────────────────────
  const secretStatus = useMemo(() => {
    const byKey = new Map(settings.map((s) => [s.key, s]));
    return {
      DB_PASSWORD: byKey.get("DB_PASSWORD")?.isSet ?? false,
      R2_ACCESS_KEY: byKey.get("R2_ACCESS_KEY")?.isSet ?? false,
      R2_SECRET_KEY: byKey.get("R2_SECRET_KEY")?.isSet ?? false,
      DRIVE_SERVICE_ACCOUNT_JSON:
        byKey.get("DRIVE_SERVICE_ACCOUNT_JSON")?.isSet ?? false,
    };
  }, [settings]);

  // ── Data loaders ──────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    const s = await backupService.getSettings();
    setSettings(s);
    setCron(getVal(s, "BACKUP_CRON") || "0 2 * * *");
    setRetentionDays(getVal(s, "BACKUP_RETENTION_DAYS") || "7");
    setPaths(getVal(s, "BACKUP_PATHS") || '["uploads"]');
    try {
      const t = JSON.parse(
        getVal(s, "BACKUP_STORAGE_TARGETS") || '["R2","DRIVE"]'
      ) as StorageTarget[];
      setTargets(t);
    } catch {
      setTargets(["R2", "DRIVE"]);
    }
    setDbHost(getVal(s, "DB_HOST"));
    setDbPort(getVal(s, "DB_PORT") || "3306");
    setDbUser(getVal(s, "DB_USER"));
    setDbName(getVal(s, "DB_NAME"));
    setR2Endpoint(getVal(s, "R2_ENDPOINT"));
    setR2Bucket(getVal(s, "R2_BUCKET"));
    setR2Region(getVal(s, "R2_REGION") || "auto");
    setR2Prefix(getVal(s, "R2_PREFIX") || "backups");
    setDriveFolderName(getVal(s, "DRIVE_FOLDER_NAME") || "backups");
    setDriveFolderId(getVal(s, "DRIVE_FOLDER_ID") || "");
  }, []);

  const loadRuns = useCallback(async () => {
    const r = await backupService.list();
    setRuns(r);
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const s = await backupService.getStatus();
      setRunStatus(s);
      if (!s.running) await loadRuns();
    } catch {}
  }, [loadRuns]);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollStatus, 3000);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setPageLoading(true);
      try {
        await Promise.all([loadSettings(), loadRuns(), pollStatus()]);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load backup data");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (runStatus.running) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [runStatus.running]);

  // ── Cloud backup actions ──────────────────────────────────────────────
  const runPreflight = async () => {
    setPreflightLoading(true);
    try {
      setPreflight(await backupService.preflight());
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Preflight check failed");
    } finally {
      setPreflightLoading(false);
    }
  };

  const runManual = async () => {
    if (runStatus.running) {
      toast.error("A backup is already running. Please wait.");
      return;
    }
    try {
      const res = await backupService.manualBackup("Manual trigger from UI");
      toast.success(`Backup started (ID: ${res.runId.slice(0, 8)}…)`);
      setRunStatus({
        running: true,
        currentRunId: res.runId,
        runStartedAt: new Date().toISOString(),
      });
      startPolling();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Manual backup failed"
      );
      await pollStatus();
    }
  };

  const forceReset = async () => {
    if (
      !window.confirm(
        "Force-reset the backup lock?\nOnly do this if no backup is actually running."
      )
    )
      return;
    setResetting(true);
    try {
      const res = await backupService.forceReset();
      toast.success(`Lock reset. Cleared ${res.clearedRuns} stuck run(s).`);
      await Promise.all([pollStatus(), loadRuns()]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const restoreCloud = async (runId: string) => {
    const pwd = window.prompt(
      "Enter your ADMIN password to confirm cloud restore.\n\n" +
        "⚠️  This will OVERWRITE the current database and uploads."
    );
    if (!pwd) return;
    setRestoringRunId(runId);
    try {
      const res = await backupService.restore(runId, pwd);
      toast.success(res.message || "Restore completed");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Restore failed");
    } finally {
      setRestoringRunId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      JSON.parse(paths); // validate JSON
      const items: any[] = [
        { key: "BACKUP_CRON", value: cron },
        { key: "BACKUP_RETENTION_DAYS", value: retentionDays },
        { key: "BACKUP_PATHS", value: paths },
        { key: "BACKUP_STORAGE_TARGETS", value: JSON.stringify(targets) },
        { key: "DB_HOST", value: dbHost },
        { key: "DB_PORT", value: dbPort },
        { key: "DB_USER", value: dbUser },
        { key: "DB_NAME", value: dbName },
        { key: "R2_ENDPOINT", value: r2Endpoint },
        { key: "R2_BUCKET", value: r2Bucket },
        { key: "R2_REGION", value: r2Region },
        { key: "R2_PREFIX", value: r2Prefix },
        { key: "DRIVE_FOLDER_NAME", value: driveFolderName },
        { key: "DRIVE_FOLDER_ID", value: driveFolderId },
      ];
      if (dbPassword.trim())
        items.push({ key: "DB_PASSWORD", value: dbPassword, isSecret: true });
      if (r2AccessKey.trim())
        items.push({ key: "R2_ACCESS_KEY", value: r2AccessKey, isSecret: true });
      if (r2SecretKey.trim())
        items.push({ key: "R2_SECRET_KEY", value: r2SecretKey, isSecret: true });
      if (driveServiceAccountJson.trim())
        items.push({
          key: "DRIVE_SERVICE_ACCOUNT_JSON",
          value: driveServiceAccountJson,
          isSecret: true,
        });

      await backupService.updateSettingsBulk({ items });
      setDbPassword("");
      setR2AccessKey("");
      setR2SecretKey("");
      setDriveServiceAccountJson("");
      toast.success("Backup settings saved. Cron rescheduled.");
      await loadSettings();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTarget = (t: StorageTarget) =>
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  // ── LOCAL BACKUP ACTIONS ────────────────────────────────────────

  /**
   * Trigger a local backup download.
   * The server runs mysqldump + zips uploads, then streams the ZIP.
   * axios downloads it as a Blob and we trigger Save-As.
   */
  const doLocalDownload = async () => {
    setLocalDownloading(true);
    toast.info(
      "Generating local backup… this may take a few minutes for large databases.",
      { duration: 8000 }
    );
    try {
      await backupService.downloadLocalBackup();
      toast.success("Local backup downloaded successfully ✓");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Local backup download failed";
      toast.error(msg);
    } finally {
      setLocalDownloading(false);
    }
  };

  /**
   * Restore from an uploaded local-backup ZIP.
   * Sends multipart/form-data with the file + admin password.
   */
  const doLocalRestore = async () => {
    if (!localRestoreFile) {
      toast.error("Please select a .zip file first.");
      return;
    }
    if (!localRestorePassword.trim()) {
      toast.error("Please enter your admin password.");
      return;
    }

    const confirmed = window.confirm(
      `⚠️  DESTRUCTIVE OPERATION\n\n` +
        `This will OVERWRITE:\n` +
        `  • The entire database\n` +
        `  • The entire uploads/ folder\n\n` +
        `File: ${localRestoreFile.name}\n` +
        `Size: ${(localRestoreFile.size / 1024 / 1024).toFixed(2)} MB\n\n` +
        `Are you absolutely sure?`
    );
    if (!confirmed) return;

    setLocalRestoring(true);
    toast.info("Restoring from local backup… please do not close this page.", {
      duration: 30000,
    });

    try {
      const res = await backupService.restoreFromLocalZip(
        localRestoreFile,
        localRestorePassword
      );
      toast.success(res.message || "Local restore completed ✓");
      // Clear the form after success
      setLocalRestoreFile(null);
      setLocalRestorePassword("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Local restore failed"
      );
    } finally {
      setLocalRestoring(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            Backup Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin-only — daily automated backups to Cloudflare R2 &amp; Google
            Drive, plus on-demand local downloads
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runPreflight}
            disabled={preflightLoading}
          >
            {preflightLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Server className="h-4 w-4 mr-1" />
            )}
            Check Tools
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await Promise.all([loadRuns(), pollStatus()]);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>

          {runStatus.running && (
            <Button
              variant="outline"
              size="sm"
              onClick={forceReset}
              disabled={resetting}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Force Reset Lock
            </Button>
          )}

          <Button onClick={runManual} disabled={runStatus.running} size="sm">
            {runStatus.running ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Backup Running…
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-1" />
                Run Manual Backup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Running banner ────────────────────────────────────────────── */}
      {runStatus.running && (
        <Alert className="border-blue-300 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            Backup in progress — RunID:{" "}
            <code className="text-xs">{runStatus.currentRunId}</code>
            {runStatus.runStartedAt && (
              <span className="ml-2 text-xs">
                (started{" "}
                {new Date(runStatus.runStartedAt).toLocaleTimeString()})
              </span>
            )}
            <br />
            <span className="text-xs">
              Auto-refreshing every 3 s. The page will update when done.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Preflight results ─────────────────────────────────────────── */}
      {preflight && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              System Tools Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  ["mysqldump", preflight.mysqldumpAvailable],
                  ["mysql client", preflight.mysqlAvailable],
                  ["tar", preflight.tarAvailable],
                  ["settings valid", preflight.settingsValid],
                ] as [string, boolean][]
              ).map(([label, ok]) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 p-2 rounded border text-sm ${
                    ok
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {preflight.error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-mono">
                  {preflight.error}
                </AlertDescription>
              </Alert>
            )}

            {!preflight.mysqldumpAvailable && (
              <Alert className="mt-3 border-orange-200 bg-orange-50">
                <ShieldAlert className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  <strong>Windows:</strong> Install MySQL client tools and add
                  to PATH (
                  <code className="text-xs">
                    C:\Program Files\MySQL\MySQL Server 8.0\bin
                  </code>
                  ).<br />
                  <strong>Railway:</strong> Add{" "}
                  <code className="text-xs">nixpacks.toml</code> with{" "}
                  <code className="text-xs">mysql80.client</code>.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Backup Configuration ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backup Configuration
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (stored in DB — no redeploy needed)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Schedule + Retention + Paths */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                Cron Expression (UTC)
              </label>
              <Input
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 2 * * *"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: daily at 2 AM UTC
              </p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Retention (days)
              </label>
              <Input
                type="number"
                min={1}
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                Backup Paths (JSON array)
              </label>
              <Input
                value={paths}
                onChange={(e) => setPaths(e.target.value)}
                placeholder='["uploads"]'
              />
            </div>
          </div>

          {/* Storage targets */}
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium">Storage Targets:</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={targets.includes("R2")}
                onChange={() => toggleTarget("R2")}
                className="rounded"
              />
              Cloudflare R2 (Primary)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={targets.includes("DRIVE")}
                onChange={() => toggleTarget("DRIVE")}
                className="rounded"
              />
              Google Drive (Secondary)
            </label>
          </div>

          <Separator />

          {/* DB Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database (for dump / restore)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                placeholder="DB_HOST"
              />
              <Input
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                placeholder="DB_PORT (3306)"
              />
              <Input
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                placeholder="DB_USER"
              />
              <Input
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="DB_NAME"
              />
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs text-muted-foreground mb-1">
                  DB_PASSWORD:{" "}
                  <strong>
                    {secretStatus.DB_PASSWORD ? "✓ SET" : "✗ NOT SET"}
                  </strong>{" "}
                  — type below to update (leave blank to keep current)
                </p>
                <Input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="DB_PASSWORD (type to update)"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* R2 Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3">☁ Cloudflare R2</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={r2Endpoint}
                onChange={(e) => setR2Endpoint(e.target.value)}
                placeholder="R2_ENDPOINT"
              />
              <Input
                value={r2Bucket}
                onChange={(e) => setR2Bucket(e.target.value)}
                placeholder="R2_BUCKET"
              />
              <Input
                value={r2Region}
                onChange={(e) => setR2Region(e.target.value)}
                placeholder="R2_REGION (auto)"
              />
              <Input
                value={r2Prefix}
                onChange={(e) => setR2Prefix(e.target.value)}
                placeholder="R2_PREFIX (backups)"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  R2_ACCESS_KEY:{" "}
                  <strong>
                    {secretStatus.R2_ACCESS_KEY ? "✓ SET" : "✗ NOT SET"}
                  </strong>
                </p>
                <Input
                  type="password"
                  value={r2AccessKey}
                  onChange={(e) => setR2AccessKey(e.target.value)}
                  placeholder="R2_ACCESS_KEY (type to update)"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  R2_SECRET_KEY:{" "}
                  <strong>
                    {secretStatus.R2_SECRET_KEY ? "✓ SET" : "✗ NOT SET"}
                  </strong>
                </p>
                <Input
                  type="password"
                  value={r2SecretKey}
                  onChange={(e) => setR2SecretKey(e.target.value)}
                  placeholder="R2_SECRET_KEY (type to update)"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Drive Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              🗂 Google Drive (Service Account)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={driveFolderName}
                onChange={(e) => setDriveFolderName(e.target.value)}
                placeholder="DRIVE_FOLDER_NAME (backups)"
              />
              <Input
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="DRIVE_FOLDER_ID"
              />
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">
                  DRIVE_SERVICE_ACCOUNT_JSON:{" "}
                  <strong>
                    {secretStatus.DRIVE_SERVICE_ACCOUNT_JSON
                      ? "✓ SET"
                      : "✗ NOT SET"}
                  </strong>{" "}
                  — paste full JSON to update
                </p>
                <Input
                  type="password"
                  value={driveServiceAccountJson}
                  onChange={(e) => setDriveServiceAccountJson(e.target.value)}
                  placeholder='{"type":"service_account","client_email":"…"}'
                />
              </div>
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Backup Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════
          LOCAL BACKUP CARD  (NEW)
          ══════════════════════════════════════════════════════════════════ */}
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Download className="h-5 w-5" />
            Local Backup Storage
            <Badge
              variant="outline"
              className="text-xs font-normal border-emerald-300 text-emerald-700 ml-1"
            >
              No cloud required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── Download section ──────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-emerald-900 mb-1">
              Download a local backup
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Generates a ZIP on-the-fly containing:
            </p>
            <ul className="text-sm text-muted-foreground space-y-0.5 mb-4 pl-4 list-disc">
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  database.sql
                </code>{" "}
                — full mysqldump of the live database
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">uploads/</code>{" "}
                — complete uploads folder
              </li>
              <li>
                <code className="text-xs bg-muted px-1 rounded">
                  manifest.json
                </code>{" "}
                — backup metadata
              </li>
            </ul>

            <Alert className="border-amber-200 bg-amber-50 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <strong>Large databases may take several minutes.</strong> Keep
                this page open and do not click away until the download begins.
                The download uses your JWT auth token — opening the URL in a new
                tab will not work.
              </AlertDescription>
            </Alert>

            <Button
              onClick={doLocalDownload}
              disabled={localDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {localDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating backup…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Local Backup (ZIP)
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* ── Restore section ───────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Restore from local backup ZIP
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upload a ZIP produced by the download above. The server will:
            </p>
            <ol className="text-sm text-muted-foreground space-y-0.5 mb-4 pl-4 list-decimal">
              <li>Verify your admin password</li>
              <li>
                Restore{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  database.sql
                </code>{" "}
                into MySQL
              </li>
              <li>
                Replace{" "}
                <code className="text-xs bg-muted px-1 rounded">uploads/</code>{" "}
                (old uploads backed up as{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  uploads.bak-…
                </code>
                )
              </li>
            </ol>

            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                <strong>Destructive operation.</strong> This will completely
                overwrite the current database and file uploads. This cannot be
                undone. Ensure you have a recent cloud backup as a safety net.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-w-lg">
              {/* File picker */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  Select backup ZIP file
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="block w-full text-sm text-gray-700 border border-input rounded-md px-3 py-2 bg-background cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                  onChange={(e) =>
                    setLocalRestoreFile(e.target.files?.[0] ?? null)
                  }
                />
                {localRestoreFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected:{" "}
                    <strong>{localRestoreFile.name}</strong> (
                    {(localRestoreFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Admin password */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  Admin password (confirmation)
                </label>
                <Input
                  type="password"
                  placeholder="Your current admin password"
                  value={localRestorePassword}
                  onChange={(e) => setLocalRestorePassword(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Restore button */}
              <Button
                variant="destructive"
                onClick={doLocalRestore}
                disabled={
                  !localRestoreFile ||
                  !localRestorePassword.trim() ||
                  localRestoring
                }
                className="w-full sm:w-auto"
              >
                {localRestoring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restoring… do not close this page
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Backup History ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cloud Backup History
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {runs.length} run(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No cloud backups yet. Run your first manual backup above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((r) => (
                <div
                  key={r.runId}
                  className={`border rounded-lg p-4 ${
                    r.status === "RUNNING"
                      ? "border-blue-200 bg-blue-50"
                      : r.status === "FAILED"
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(r.status)}
                        <Badge variant="outline" className="text-xs">
                          {r.trigger}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {r.runId.slice(0, 8)}…
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(r.createdAt).toLocaleString()}
                        {r.finishedAt && (
                          <span>
                            {" "}
                            → {new Date(r.finishedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs mt-1">
                        {r.mysql && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Database className="h-3 w-3" />
                            {r.mysql.fileName}
                            {r.mysql.sizeBytes != null && (
                              <span className="text-muted-foreground/70">
                                ({formatBytes(r.mysql.sizeBytes)})
                              </span>
                            )}
                            {r.mysql.r2Key && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0"
                              >
                                R2
                              </Badge>
                            )}
                            {r.mysql.driveFileId && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0"
                              >
                                Drive
                              </Badge>
                            )}
                          </div>
                        )}
                        {r.uploads && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <HardDrive className="h-3 w-3" />
                            {r.uploads.fileName}
                            {r.uploads.sizeBytes != null && (
                              <span className="text-muted-foreground/70">
                                ({formatBytes(r.uploads.sizeBytes)})
                              </span>
                            )}
                            {r.uploads.r2Key && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0"
                              >
                                R2
                              </Badge>
                            )}
                            {r.uploads.driveFileId && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0"
                              >
                                Drive
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {r.error && (
                        <div className="text-xs text-red-700 bg-red-100 rounded px-2 py-1 font-mono mt-1 break-all">
                          {r.error}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => restoreCloud(r.runId)}
                        disabled={
                          r.status !== "SUCCESS" ||
                          restoringRunId === r.runId ||
                          runStatus.running
                        }
                      >
                        {restoringRunId === r.runId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Restore"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
