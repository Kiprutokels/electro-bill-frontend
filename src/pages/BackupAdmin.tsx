import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  Trash2,
  Download,
  Play,
} from "lucide-react";

import { backupService } from "@/api/services/backup.service";
import type {
  BackupListItem,
  BackupPreflight,
  BackupRunStatus,
  BackupSettingPublic,
  StorageTarget,
  LocalBackupKind,
  LocalStoreJobStatus,
  LocalStoredBackupItem,
} from "@/api/types/backup.types";

// ── Small helpers ───────────────────────────────────────────

function getVal(settings: BackupSettingPublic[], key: string): string {
  return settings.find((x) => x.key === key)?.value ?? "";
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function statusBadge(status: BackupListItem["status"]) {
  switch (status) {
    case "SUCCESS":
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "RUNNING":
      return (
        <Badge className="bg-blue-100 text-blue-800 animate-pulse">
          Running
        </Badge>
      );
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
  }
}

function parseDailyCron(cron: string): {
  isDaily: boolean;
  hhmm: string | null;
} {
  // matches: "m h * * *"
  const m = cron.trim().match(/^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/);
  if (!m) return { isDaily: false, hhmm: null };
  const mm = String(Number(m[1])).padStart(2, "0");
  const hh = String(Number(m[2])).padStart(2, "0");
  return { isDaily: true, hhmm: `${hh}:${mm}` };
}

function dailyTimeToCron(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map((x) => Number(x));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${mm} ${hh} * * *`;
}

// ── Component ───────────────────────────────────────────────

export default function BackupAdmin() {
  // global page
  const [pageLoading, setPageLoading] = useState(true);

  // common backend state
  const [settings, setSettings] = useState<BackupSettingPublic[]>([]);
  const [runs, setRuns] = useState<BackupListItem[]>([]);
  const [runStatus, setRunStatus] = useState<BackupRunStatus>({
    running: false,
    currentRunId: null,
    runStartedAt: null,
  });
  const [preflight, setPreflight] = useState<BackupPreflight | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // settings form
  const [saving, setSaving] = useState(false);
  const [cronMode, setCronMode] = useState<"daily" | "advanced">("daily");
  const [dailyTime, setDailyTime] = useState("02:00");
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

  const [resetting, setResetting] = useState(false);
  const [restoringCloudRunId, setRestoringCloudRunId] = useState<string | null>(
    null,
  );

  // local store UI
  const [localKind, setLocalKind] = useState<LocalBackupKind>("FULL");
  const [localJobId, setLocalJobId] = useState<string | null>(null);
  const [localJob, setLocalJob] = useState<LocalStoreJobStatus | null>(null);
  const [localList, setLocalList] = useState<LocalStoredBackupItem[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // restore UX
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedLocalFile, setSelectedLocalFile] = useState<string>("");

  // derived
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

  // ── Loaders ───────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    const s = await backupService.getSettings();
    setSettings(s);

    const cronValue = getVal(s, "BACKUP_CRON") || "0 2 * * *";
    setCron(cronValue);

    const parsed = parseDailyCron(cronValue);
    if (parsed.isDaily && parsed.hhmm) {
      setCronMode("daily");
      setDailyTime(parsed.hhmm);
    } else {
      setCronMode("advanced");
      setDailyTime("02:00");
    }

    setRetentionDays(getVal(s, "BACKUP_RETENTION_DAYS") || "7");
    setPaths(getVal(s, "BACKUP_PATHS") || '["uploads"]');

    try {
      const t = JSON.parse(
        getVal(s, "BACKUP_STORAGE_TARGETS") || '["R2","DRIVE"]',
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
    setRuns(await backupService.list());
  }, []);

  const loadLocalList = useCallback(async () => {
    setLocalLoading(true);
    try {
      setLocalList(await backupService.listLocalStoredBackups());
    } finally {
      setLocalLoading(false);
    }
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

  // init
  useEffect(() => {
    (async () => {
      setPageLoading(true);
      try {
        await Promise.all([
          loadSettings(),
          loadRuns(),
          pollStatus(),
          loadLocalList(),
        ]);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load backup data");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // cloud polling while running
  useEffect(() => {
    if (runStatus.running) startPolling();
    else stopPolling();
    return () => stopPolling();
  }, [runStatus.running]);

  // local job polling
  useEffect(() => {
    if (!localJobId) return;

    let timer: any = null;
    timer = setInterval(async () => {
      try {
        const st = await backupService.getLocalStoredBackupStatus(localJobId);
        setLocalJob(st);

        if (st.stage === "DONE" || st.stage === "FAILED") {
          clearInterval(timer);
          timer = null;
          setLocalJobId(null);
          await loadLocalList();
        }
      } catch {}
    }, 1500);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [localJobId, loadLocalList]);

  // ── Actions: Cloud ────────────────────────────────────────

  const runPreflight = async () => {
    setPreflightLoading(true);
    try {
      setPreflight(await backupService.preflight());
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Preflight failed");
    } finally {
      setPreflightLoading(false);
    }
  };

  const runManual = async () => {
    if (runStatus.running) return toast.error("A backup is already running.");
    try {
      const res = await backupService.manualBackup("Manual trigger from UI");
      toast.success(`Cloud backup started (${res.runId.slice(0, 8)}…)`);
      setRunStatus({
        running: true,
        currentRunId: res.runId,
        runStartedAt: new Date().toISOString(),
      });
      startPolling();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Manual backup failed",
      );
      await pollStatus();
    }
  };

  const forceReset = async () => {
    if (
      !window.confirm(
        "Force-reset the backup lock? Only do this if you are sure nothing is running.",
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
      "Enter ADMIN password to confirm CLOUD restore (destructive).",
    );
    if (!pwd) return;
    setRestoringCloudRunId(runId);
    const toastId = toast.loading("Restoring cloud backup…");
    try {
      const res = await backupService.restore(runId, pwd);
      toast.success(res.message || "Restore completed", { id: toastId });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Restore failed", {
        id: toastId,
      });
    } finally {
      setRestoringCloudRunId(null);
    }
  };

  const deleteCloud = async (runId: string) => {
    if (
      !window.confirm(
        "Delete this cloud backup run? This also deletes R2/Drive artifacts.",
      )
    )
      return;
    const toastId = toast.loading("Deleting cloud backup…");
    try {
      await backupService.deleteCloudRun(runId);
      toast.success("Deleted", { id: toastId });
      await loadRuns();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed", {
        id: toastId,
      });
    }
  };

  // ── Actions: Local store ──────────────────────────────────

  const createLocal = async (downloadAfter = false) => {
    const toastId = toast.loading("Creating local backup…");
    try {
      const res = await backupService.createLocalStoredBackup(localKind);
      setLocalJobId(res.jobId);
      setLocalJob(null);
      toast.success("Local backup job started", { id: toastId });

      if (downloadAfter) {
        // wait for DONE then download automatically
        const wait = async () => {
          while (true) {
            const st = await backupService.getLocalStoredBackupStatus(
              res.jobId,
            );
            setLocalJob(st);
            if (st.stage === "DONE" && st.fileName) return st.fileName;
            if (st.stage === "FAILED")
              throw new Error(st.error || "Local backup failed");
            await new Promise((r) => setTimeout(r, 1500));
          }
        };
        const fileName = await wait();
        await loadLocalList();
        await backupService.downloadLocalStoredBackup(fileName);
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Local backup failed",
        { id: toastId },
      );
    }
  };

  const deleteLocal = async (fileName: string) => {
    if (!window.confirm(`Delete local backup "${fileName}"?`)) return;
    const toastId = toast.loading("Deleting local backup…");
    try {
      await backupService.deleteLocalStoredBackup(fileName);
      toast.success("Deleted", { id: toastId });
      await loadLocalList();
      if (selectedLocalFile === fileName) setSelectedLocalFile("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed", {
        id: toastId,
      });
    }
  };

  const restoreLocalSelected = async () => {
    if (!selectedLocalFile)
      return toast.error("Select a local backup from the list first.");
    if (!adminPassword.trim()) return toast.error("Enter admin password.");

    const verifyToast = toast.loading("Verifying password…");
    try {
      await backupService.verifyAdminPassword(adminPassword);
      toast.success("Password OK", { id: verifyToast });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Invalid password", {
        id: verifyToast,
      });
      return;
    }

    if (
      !window.confirm(
        `Restore from "${selectedLocalFile}"? This will overwrite DB + uploads.`,
      )
    )
      return;

    const toastId = toast.loading("Restoring local backup…");
    try {
      const res = await backupService.restoreLocalStoredBackup(
        selectedLocalFile,
        adminPassword,
      );
      toast.success(res.message || "Restore completed", { id: toastId });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Restore failed", {
        id: toastId,
      });
    }
  };

  // ── Save settings ─────────────────────────────────────────
  const saveSettings = async () => {
    setSaving(true);
    try {
      JSON.parse(paths);

      const finalCron =
        cronMode === "daily" ? dailyTimeToCron(dailyTime) : cron;

      if (!finalCron) {
        throw new Error("Invalid daily time");
      }

      const items: any[] = [
        { key: "BACKUP_CRON", value: finalCron },
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
        items.push({
          key: "R2_ACCESS_KEY",
          value: r2AccessKey,
          isSecret: true,
        });
      if (r2SecretKey.trim())
        items.push({
          key: "R2_SECRET_KEY",
          value: r2SecretKey,
          isSecret: true,
        });
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

      toast.success("Settings saved. Cron rescheduled.");
      await loadSettings();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTarget = (t: StorageTarget) =>
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  // ── Render ────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cronInfo = parseDailyCron(cron);

  return (
    <div className="p-4 space-y-4">
      {/* Header (compact) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backups
          </h1>
          <p className="text-sm text-muted-foreground">
            Cloud backups (R2/Drive) + Local backup storage (save-first,
            download later)
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
            Tools
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await Promise.all([loadRuns(), pollStatus(), loadLocalList()]);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {runStatus.running && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Cloud backup running —{" "}
            <code className="text-xs">{runStatus.currentRunId}</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="cloud" className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-[520px]">
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="local">Local Storage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ───────────────────────────────────────── Cloud tab ───────────────────────────────────────── */}
        <TabsContent value="cloud" className="space-y-4">
          {preflight && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> Preflight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  {(
                    [
                      ["mysqldump", preflight.mysqldumpAvailable],
                      ["mysql", preflight.mysqlAvailable],
                      ["tar", preflight.tarAvailable],
                      ["settings", preflight.settingsValid],
                    ] as [string, boolean][]
                  ).map(([label, ok]) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        ok
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {ok ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                {preflight.error && (
                  <div className="mt-2 text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    {preflight.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cloud Backups
                </span>
                <div className="flex gap-2">
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
                      Reset Lock
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={runManual}
                    disabled={runStatus.running}
                  >
                    {runStatus.running ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Cloud Backup
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {runs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No cloud backups yet.
                </div>
              ) : (
                runs.map((r) => (
                  <div key={r.runId} className="border rounded p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {statusBadge(r.status)}
                          <Badge variant="outline" className="text-xs">
                            {r.trigger}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {r.runId.slice(0, 8)}…
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(r.createdAt).toLocaleString()}
                        </div>

                        {r.error && (
                          <div className="mt-2 text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded p-2 break-all">
                            {r.error}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {r.mysql && (
                            <div className="flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              <span className="truncate">
                                {r.mysql.fileName}
                              </span>
                              <span>({formatBytes(r.mysql.sizeBytes)})</span>
                            </div>
                          )}
                          {r.uploads && (
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-3 w-3" />
                              <span className="truncate">
                                {r.uploads.fileName}
                              </span>
                              <span>({formatBytes(r.uploads.sizeBytes)})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => restoreCloud(r.runId)}
                          disabled={
                            r.status !== "SUCCESS" ||
                            runStatus.running ||
                            restoringCloudRunId === r.runId
                          }
                        >
                          {restoringCloudRunId === r.runId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Restore"
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCloud(r.runId)}
                          disabled={r.status === "RUNNING"}
                          className="text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────────────────────────────── Local tab ───────────────────────────────────────── */}
        <TabsContent value="local" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Local Backup Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="w-full sm:w-[220px]">
                  <label className="text-xs text-muted-foreground">
                    Backup type
                  </label>
                  <select
                    className="w-full border rounded px-2 py-2 text-sm bg-background"
                    value={localKind}
                    onChange={(e) =>
                      setLocalKind(e.target.value as LocalBackupKind)
                    }
                  >
                    <option value="FULL">FULL (DB + uploads)</option>
                    <option value="DB_ONLY">DB ONLY</option>
                    <option value="UPLOADS_ONLY">UPLOADS ONLY</option>
                  </select>
                </div>

                <Button size="sm" onClick={() => createLocal(false)}>
                  <Play className="h-4 w-4 mr-2" />
                  Create (store)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createLocal(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Create & Download
                </Button>
              </div>

              {/* Progress */}
              {localJob && (
                <div className="border rounded p-3 bg-muted/20">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">
                      Job: {localJob.kind} — {localJob.stage}
                    </div>
                    <div className="text-muted-foreground">
                      {localJob.percent}%
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {localJob.message}
                  </div>
                  <div className="mt-2 h-2 w-full bg-muted rounded">
                    <div
                      className="h-2 bg-blue-600 rounded"
                      style={{
                        width: `${Math.max(0, Math.min(100, localJob.percent))}%`,
                      }}
                    />
                  </div>
                  {localJob.stage === "FAILED" && (
                    <div className="mt-2 text-xs font-mono text-red-700">
                      {localJob.error}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Restore controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Select stored backup
                  </label>
                  <select
                    className="w-full border rounded px-2 py-2 text-sm bg-background"
                    value={selectedLocalFile}
                    onChange={(e) => setSelectedLocalFile(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {localList.map((b) => (
                      <option key={b.fileName} value={b.fileName}>
                        {b.fileName} ({b.kind}, {formatBytes(b.sizeBytes)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Admin password (required to restore)
                  </label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={restoreLocalSelected}
                >
                  Restore selected
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedLocalFile)
                      return toast.error("Select a backup first.");
                    await backupService.downloadLocalStoredBackup(
                      selectedLocalFile,
                    );
                  }}
                >
                  <Download className="h-4 w-4 mr-2" /> Download selected
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedLocalFile)
                      return toast.error("Select a backup first.");
                    await deleteLocal(selectedLocalFile);
                  }}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete selected
                </Button>
              </div>

              <Separator />

              {/* Local list */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Stored backups
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLocalList}
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reload"
                  )}
                </Button>
              </div>

              {localList.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No stored backups yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {localList.map((b) => (
                    <div key={b.fileName} className="border rounded p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {b.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {b.kind} • {formatBytes(b.sizeBytes)} •{" "}
                            {new Date(b.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              backupService.downloadLocalStoredBackup(
                                b.fileName,
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => deleteLocal(b.fileName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-800 text-sm">
                  Local backups are stored on the server in{" "}
                  <code>{"backups/local"}</code>. For Railway persistence, mount
                  a Volume and point <code>BACKUP_LOCAL_DIR</code> into it.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───────────────────────────────────────── Settings tab ───────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" /> Backup Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cron mode */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Schedule</div>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={cronMode === "daily"}
                      onChange={() => setCronMode("daily")}
                    />
                    Daily time (UTC)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={cronMode === "advanced"}
                      onChange={() => setCronMode("advanced")}
                    />
                    Advanced cron
                  </label>
                </div>

                {cronMode === "daily" ? (
                  <div className="max-w-xs">
                    <label className="text-xs text-muted-foreground">
                      Daily time (UTC)
                    </label>
                    <Input
                      value={dailyTime}
                      onChange={(e) => setDailyTime(e.target.value)}
                      placeholder="HH:MM"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Will run once per day at {dailyTime} UTC.
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Cron expression (UTC)
                    </label>
                    <Input
                      value={cron}
                      onChange={(e) => setCron(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {cronInfo.isDaily
                        ? `Detected daily schedule (${cronInfo.hhmm} UTC)`
                        : "Custom schedule"}
                      {" — "}Backups are protected by a DB lock to prevent
                      double-runs across instances.
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Retention (days)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">
                    Backup paths (JSON array)
                  </label>
                  <Input
                    value={paths}
                    onChange={(e) => setPaths(e.target.value)}
                    placeholder='["uploads"]'
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center text-sm">
                <span className="font-medium">Targets:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targets.includes("R2")}
                    onChange={() => toggleTarget("R2")}
                  />
                  R2
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targets.includes("DRIVE")}
                    onChange={() => toggleTarget("DRIVE")}
                  />
                  Drive
                </label>
              </div>

              <Separator />

              <div className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" /> DB settings (used by cloud +
                local store)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  placeholder="DB_HOST"
                />
                <Input
                  value={dbPort}
                  onChange={(e) => setDbPort(e.target.value)}
                  placeholder="DB_PORT"
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
                  <div className="text-xs text-muted-foreground mb-1">
                    DB_PASSWORD:{" "}
                    <strong>
                      {secretStatus.DB_PASSWORD ? "SET" : "NOT SET"}
                    </strong>{" "}
                    (type to update)
                  </div>
                  <Input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="DB_PASSWORD"
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tools action note */}
      <div className="text-xs text-muted-foreground">
        Tip: click <strong>Tools</strong> to verify <code>mysqldump</code>/
        <code>mysql</code> availability.
      </div>
    </div>
  );
}
