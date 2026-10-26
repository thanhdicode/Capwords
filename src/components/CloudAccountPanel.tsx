import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppState } from "../domain/types";
import { useCloudAccount } from "../cloud/CloudAccountContext";

export interface CloudAccountPanelProps {
  state: AppState;
  onRestore: (state: AppState) => Promise<number>;
}
export function CloudAccountPanel({
  state,
  onRestore,
}: CloudAccountPanelProps) {
  const cloud = useCloudAccount();
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const actionRef = useRef(false);
  const action = async (work: () => Promise<void>) => {
    if (actionRef.current) return;
    actionRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cloud request failed",
      );
    } finally {
      setBusy(false);
      actionRef.current = false;
    }
  };
  if (!cloud.ready)
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Cloud account</Text>
        <ActivityIndicator />
        <Text>Checking cloud account…</Text>
      </View>
    );
  if (!cloud.configured)
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Cloud account</Text>
        <Text>Cloud backup is not configured for this build.</Text>
      </View>
    );
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Cloud account</Text>
      {!cloud.user ? (
        <>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title="Send code"
            disabled={busy || !email.trim()}
            onPress={() =>
              action(async () => {
                await cloud.sendCode(email);
                setSecret("");
                setMessage("Code sent. Check your email.");
              })
            }
          />
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="number-pad"
            placeholder="One-time code"
            value={secret}
            onChangeText={setSecret}
          />
          <Button
            title="Verify code"
            disabled={busy || !cloud.pendingUserId || !secret.trim()}
            onPress={() =>
              action(async () => {
                await cloud.verifyCode(cloud.pendingUserId || "", secret);
                setSecret("");
                setMessage("Email verified and signed in.");
              })
            }
          />
        </>
      ) : (
        <>
          <Text>Signed in as {cloud.user.email}</Text>
          <Button
            title="Backup library"
            disabled={busy}
            onPress={() =>
              action(async () => {
                await cloud.backup(state);
                setMessage("Backup created successfully.");
              })
            }
          />
          <Button
            title="Restore newest backup"
            disabled={busy}
            onPress={() =>
              action(async () => {
                const result = await cloud.restoreNewest();
                try {
                  const count = await onRestore(result.state);
                  setMessage(
                    `Restored ${count} missing words and ${result.downloadedPhotos} photos.`,
                  );
                } catch (error) {
                  await cloud.cleanupRestoredFiles(
                    result.downloadedPhotoUris ?? [],
                  );
                  throw error;
                }
              })
            }
          />
          <Button
            title="Upload photo"
            disabled={busy}
            onPress={() =>
              action(async () => {
                await cloud.pickAndUpload("photo");
                setMessage("Photo uploaded.");
              })
            }
          />
          <Button
            title="Upload video"
            disabled={busy}
            onPress={() =>
              action(async () => {
                await cloud.pickAndUpload("video");
                setMessage("Video uploaded.");
              })
            }
          />
          <Button
            title="Sign out"
            disabled={busy}
            onPress={() =>
              action(async () => {
                await cloud.signOut();
                setSecret("");
                setMessage("Signed out.");
              })
            }
          />
          <Text style={styles.subtitle}>Private media</Text>
          {cloud.media.length === 0 ? (
            <Text>No uploaded media.</Text>
          ) : (
            cloud.media.map((item) => (
              <Text key={item.fileId}>
                {item.name} · {item.kind} · {Math.round(item.size / 1024)}KB
              </Text>
            ))
          )}
        </>
      )}
      {busy && <ActivityIndicator />}
      {cloud.error ? <Text style={styles.error}>{cloud.error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.note}>
        Backups are explicit only. No automatic sync, account deletion, or
        in-app purchases are implemented.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    margin: 12,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontWeight: "700", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#bbb", borderRadius: 6, padding: 10 },
  error: { color: "#b00020" },
  message: { color: "#236b36" },
  note: { color: "#666", fontSize: 12, marginTop: 8 },
});
export default CloudAccountPanel;
