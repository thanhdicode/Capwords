import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppState } from "../domain/types";
import { readCloudConfig, type CloudConfig } from "./schema";
import { CloudService, type CloudMediaItem } from "./service";
import type { CloudUser, UploadSource } from "./client";

export interface CloudAccountState {
  configured: boolean;
  ready: boolean;
  user: CloudUser | null;
  error?: string;
  media: CloudMediaItem[];
  pendingUserId?: string;
  getJWT(): Promise<string>;
  sendCode(email: string): Promise<string>;
  verifyCode(userId: string, secret: string): Promise<void>;
  signOut(): Promise<void>;
  upload(source: UploadSource): Promise<void>;
  pickAndUpload(kind: "photo" | "video"): Promise<void>;
  backup(state: AppState): Promise<void>;
  restoreNewest(): Promise<{
    state: AppState;
    downloadedPhotos: number;
    downloadedPhotoUris?: string[];
  }>;
  cleanupRestoredFiles(uris: string[]): Promise<void>;
  refreshMedia(): Promise<void>;
}
const Context = createContext<CloudAccountState | null>(null);
const resolvedEnvironmentConfig = readCloudConfig();
export function CloudAccountProvider({
  children,
  config = resolvedEnvironmentConfig,
}: {
  children: React.ReactNode;
  config?: CloudConfig | null;
}) {
  const service = useMemo(
    () => (config ? new CloudService(config) : null),
    [config],
  );
  const [user, setUser] = useState<CloudUser | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string>();
  const [ready, setReady] = useState(!service);
  const [error, setError] = useState<string>();
  const [media, setMedia] = useState<CloudMediaItem[]>([]);
  const run = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      setError(undefined);
      try {
        return await operation();
      } catch (value) {
        setError(
          value instanceof Error ? value.message : "Cloud request failed",
        );
        throw value;
      }
    },
    [],
  );
  const refreshMedia = useCallback(async () => {
    if (service && user) setMedia(await service.listMedia());
  }, [service, user]);
  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      if (mounted) {
        setReady(!service);
        setUser(null);
        setMedia([]);
      }
    });
    if (!service)
      return () => {
        mounted = false;
      };
    void service
      .getUser()
      .then((accountUser) => {
        if (mounted) setUser(accountUser);
      })
      .catch((value) => {
        if (mounted)
          setError(
            value instanceof Error ? value.message : "Cloud request failed",
          );
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [service]);
  const userId = user?.$id;
  useEffect(() => {
    let mounted = true;
    void Promise.resolve()
      .then(async () => {
        if (!mounted || !service || !userId) return;
        const files = await service.listMedia();
        if (mounted) setMedia(files);
      })
      .catch((value) => {
        if (mounted)
          setError(
            value instanceof Error
              ? value.message
              : "Could not load cloud media",
          );
      });
    return () => {
      mounted = false;
    };
  }, [service, userId]);
  const value = useMemo<CloudAccountState>(
    () => ({
      configured: Boolean(service),
      ready,
      user,
      pendingUserId,
      error,
      media,
      getJWT: () =>
        run(() => {
          if (!service) throw new Error("Cloud is not configured");
          return service.getJWT();
        }),
      sendCode: (email) =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          const id = await service.sendCode(email);
          setPendingUserId(id);
          return id;
        }),
      verifyCode: (id, secret) =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          const accountUser = await service.verifyCode(id, secret);
          setUser(accountUser);
          setPendingUserId(undefined);
          setMedia(await service.listMedia());
        }),
      signOut: () =>
        run(async () => {
          if (service) await service.signOut();
          setUser(null);
          setPendingUserId(undefined);
          setMedia([]);
        }),
      upload: (source) =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          await service.uploadMedia(source);
          await refreshMedia();
        }),
      pickAndUpload: (kind) =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          await service.pickAndUpload(kind);
          await refreshMedia();
        }),
      backup: (state) =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          await service.backup(state);
          await refreshMedia();
        }),
      restoreNewest: () =>
        run(async () => {
          if (!service) throw new Error("Cloud is not configured");
          return service.restoreNewest();
        }),
      cleanupRestoredFiles: (uris) =>
        service?.cleanupRestoredFiles(uris) ?? Promise.resolve(),
      refreshMedia: () => run(refreshMedia),
    }),
    [service, ready, user, pendingUserId, error, media, run, refreshMedia],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCloudAccount(): CloudAccountState {
  const value = useContext(Context);
  if (!value)
    throw new Error("useCloudAccount must be used inside CloudAccountProvider");
  return value;
}
