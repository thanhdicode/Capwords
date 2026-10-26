import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Asset } from "expo-asset";
import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  Body,
  CircleButton,
  Icon,
  PillButton,
  Rounded,
  Screen,
  Serif,
  Sheet,
  TopBar,
} from "../components/UI";
import { CameraRing } from "../components/CameraRing";
import { RecognitionResultBackdrop } from "../components/RecognitionResultBackdrop";
import { ResultPronunciationButton } from "../components/ResultPronunciationButton";
import { Sticker } from "../components/Sticker";
import { isFlowerStickerEmoji, STICKER_EMOJI } from "../data/stickerAssets";
import { CaptureAsset, RecognitionResult } from "../services/recognition";
import { imageUriForCapture } from "../services/captureImage";
import {
  captureDateLabel,
  captureTimestampFromPhotoMetadata,
} from "../domain/captureDate";
import { captureReferenceTimestamps } from "../data/captureReference";
import { recognitionGuidanceCopy } from "../data/recognitionGuidance";
import { Navigate } from "../navigation/types";
import {
  captureDesign,
  cropEditorDesign,
  colors,
  metrics,
  recognitionResultDesign as resultDesign,
} from "../theme/tokens";
import { NewWord } from "../domain/types";
import { CropEditor } from "../components/CropEditor";
import { ObjectNameEditor } from "../components/ObjectNameEditor";
import { RecognitionGuidanceSheet } from "../components/RecognitionGuidanceSheet";
import { cameraPermissionAction } from "../domain/cameraPermission";
import { createVideoRecognitionFrame } from "../services/videoFrame";
import {
  videoCapturePolicy,
  videoCaptureProgress,
} from "../domain/videoCapturePolicy";

const confirmControlAssets = {
  source012: {
    rotate: require("../../assets/confirm-controls/012-rotate.png"),
    checkmark: require("../../assets/confirm-controls/012-checkmark.png"),
    crop: require("../../assets/confirm-controls/012-crop.png"),
  },
  source035: {
    rotate: require("../../assets/confirm-controls/035-rotate.png"),
    checkmark: require("../../assets/confirm-controls/035-checkmark.png"),
    crop: require("../../assets/confirm-controls/035-crop.png"),
  },
};

export function CaptureScreen({
  navigate,
  onCapture,
  fixture = false,
  videoFrameFixture = false,
  source034Fixture = false,
}: {
  navigate: Navigate;
  onCapture: (asset: CaptureAsset) => void | Promise<void>;
  fixture?: boolean;
  videoFrameFixture?: boolean;
  source034Fixture?: boolean;
}) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const askedOnEntry = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [videoRecording, setVideoRecording] = useState(false),
    [videoProgress, setVideoProgress] = useState(0);
  const recording = useRef(false),
    pendingVideo = useRef(false),
    videoGesture = useRef(false),
    stopAfterStart = useRef(false),
    videoStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    videoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    videoProgressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const accessAction = cameraPermissionAction(
    permission,
    Platform.OS === "web",
  );
  const askForCamera = useCallback(async () => {
    try {
      await requestPermission();
    } catch {
      setError(
        "Camera permission could not be requested. You can choose a photo instead.",
      );
    }
  }, [requestPermission]);
  const openCameraSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setError(
        "Could not open app settings. Enable camera access in your device settings or choose a photo instead.",
      );
    }
  };
  const handleCameraPermission = () => {
    if (accessAction === "settings") void openCameraSettings();
    else if (accessAction === "request") void askForCamera();
    else if (accessAction === "browser-settings") {
      setError(
        "Camera access is blocked for this site. Change camera permission in your browser settings, or choose a photo instead.",
      );
    }
  };
  useEffect(() => {
    if (
      !fixture &&
      Platform.OS !== "web" &&
      permission?.status === "undetermined" &&
      !askedOnEntry.current
    ) {
      askedOnEntry.current = true;
      void askForCamera();
    }
  }, [fixture, permission?.status, askForCamera]);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let leftForSettings = false;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        leftForSettings = true;
      } else if (leftForSettings) {
        leftForSettings = false;
        void getPermission().catch(() => {
          setError(
            "Camera permission could not be refreshed. Please try again or choose a photo.",
          );
        });
      }
    });
    return () => subscription.remove();
  }, [getPermission]);
  useEffect(
    () => () => {
      if (videoStartTimer.current) clearTimeout(videoStartTimer.current);
      if (videoStopTimer.current) clearTimeout(videoStopTimer.current);
      if (videoProgressTimer.current) clearInterval(videoProgressTimer.current);
      if (recording.current) camera.current?.stopRecording();
    },
    [],
  );
  const capture = async () => {
    if (busy || videoGesture.current || pendingVideo.current) return;
    if (fixture) {
      await onCapture({
        uri: Asset.fromModule(require("../../assets/study-portrait.jpg")).uri,
        capturedAt: captureReferenceTimestamps.source012,
      });
      return;
    }
    if (!permission?.granted) {
      handleCameraPermission();
      return;
    }
    try {
      setBusy(true);
      const photo = await camera.current?.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo)
        await onCapture({
          uri: photo.uri,
          base64: photo.base64,
          mimeType: "image/jpeg",
          capturedAt: Date.now(),
        });
    } catch {
      setError(
        "The camera could not take a photo. You can choose one from your library instead.",
      );
    } finally {
      setBusy(false);
    }
  };
  const clearVideoProgressTimer = () => {
    if (videoProgressTimer.current) clearInterval(videoProgressTimer.current);
    videoProgressTimer.current = null;
  };
  const startVideoProgress = () => {
    clearVideoProgressTimer();
    const recordingStartedAt = Date.now();
    setVideoRecording(true);
    setVideoProgress(0);
    videoProgressTimer.current = setInterval(() => {
      setVideoProgress(videoCaptureProgress(Date.now() - recordingStartedAt));
    }, videoCapturePolicy.progressRefreshIntervalMs);
  };
  const resetVideoProgress = () => {
    clearVideoProgressTimer();
    setVideoRecording(false);
    setVideoProgress(0);
  };
  const finishVideoFrameFixture = async () => {
    if (videoStopTimer.current) clearTimeout(videoStopTimer.current);
    videoStopTimer.current = null;
    clearVideoProgressTimer();
    videoGesture.current = false;
    pendingVideo.current = false;
    stopAfterStart.current = false;
    setCameraMode("picture");
    setBusy(false);
    setVideoRecording(false);
    setVideoProgress(0);
    await onCapture({
      uri: Asset.fromModule(require("../../assets/study-portrait.jpg")).uri,
      mimeType: "image/jpeg",
      videoFrame: true,
      capturedAt: captureReferenceTimestamps.source012,
    });
  };
  const recordVideo = async () => {
    if (!pendingVideo.current) return;
    if (videoFrameFixture) {
      pendingVideo.current = false;
      startVideoProgress();
      if (stopAfterStart.current || !videoGesture.current) {
        videoStopTimer.current = setTimeout(
          () => void finishVideoFrameFixture(),
          videoCapturePolicy.shortReleaseGraceMs,
        );
      }
      return;
    }
    const cameraView = camera.current;
    if (!cameraView) {
      pendingVideo.current = false;
      videoGesture.current = false;
      setBusy(false);
      setCameraMode("picture");
      setError(
        "The camera is not ready for video. Please try again or choose a photo.",
      );
      return;
    }
    pendingVideo.current = false;
    recording.current = true;
    startVideoProgress();
    let clipUri: string | undefined;
    try {
      const clipPromise = cameraView.recordAsync({
        maxDuration: videoCapturePolicy.maximumDurationSeconds,
        maxFileSize: videoCapturePolicy.maximumFileSizeBytes,
        progressUpdateInterval:
          videoCapturePolicy.progressUpdateIntervalSeconds,
      });
      if (stopAfterStart.current || !videoGesture.current) {
        videoStopTimer.current = setTimeout(() => {
          if (recording.current) cameraView.stopRecording();
        }, videoCapturePolicy.shortReleaseGraceMs);
      }
      const clip = await clipPromise;
      if (!clip?.uri)
        throw new Error("The camera did not return a video file.");
      clipUri = clip.uri;
      const frame = await createVideoRecognitionFrame(clip.uri);
      setCameraMode("picture");
      resetVideoProgress();
      await onCapture({
        ...frame,
        capturedAt: Date.now(),
      });
    } catch {
      setCameraMode("picture");
      setError(
        "The video could not be prepared. Try again or choose a photo instead.",
      );
    } finally {
      if (clipUri) {
        try {
          new ExpoFile(clipUri).delete();
        } catch {
          // Cache cleanup is best-effort and must not block the capture flow.
        }
      }
      if (videoStopTimer.current) clearTimeout(videoStopTimer.current);
      videoStopTimer.current = null;
      recording.current = false;
      pendingVideo.current = false;
      videoGesture.current = false;
      stopAfterStart.current = false;
      setBusy(false);
      resetVideoProgress();
    }
  };
  const startVideoCapture = () => {
    if (busy || pendingVideo.current || recording.current) return;
    videoGesture.current = true;
    stopAfterStart.current = false;
    if (!videoFrameFixture && Platform.OS === "web") {
      videoGesture.current = false;
      setError(
        "Video capture is available in the iOS and Android apps, not in this web preview.",
      );
      return;
    }
    if (!videoFrameFixture && !permission?.granted) {
      videoGesture.current = false;
      handleCameraPermission();
      return;
    }
    if (!videoFrameFixture && !camera.current) {
      videoGesture.current = false;
      setError("The camera is not ready yet. Please try again.");
      return;
    }
    pendingVideo.current = true;
    setBusy(true);
    setCameraMode("video");
    videoStartTimer.current = setTimeout(() => {
      videoStartTimer.current = null;
      void recordVideo();
    }, videoCapturePolicy.recordingStartDelayMs);
  };
  const stopVideoCapture = () => {
    if (!videoGesture.current) return;
    videoGesture.current = false;
    if (pendingVideo.current) stopAfterStart.current = true;
    else if (recording.current) camera.current?.stopRecording();
    else if (videoFrameFixture && videoRecording)
      void finishVideoFrameFixture();
  };
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
        exif: true,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        setBusy(true);
        await onCapture({
          uri: asset.uri,
          base64: asset.base64 || undefined,
          mimeType: asset.mimeType || "image/jpeg",
          capturedAt: captureTimestampFromPhotoMetadata(
            asset.exif ?? undefined,
            asset.file?.lastModified,
          ),
        });
      }
    } catch {
      setError(
        "Photo access was unavailable. Please check the photo permissions for this app.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen background="#000" light>
      <View style={StyleSheet.absoluteFill}>
        {permission?.granted && !fixture && (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode={cameraMode}
            mute
          />
        )}
      </View>
      <Serif style={s.cameraDate}>
        {captureDateLabel(
          fixture ? captureReferenceTimestamps.source012 : undefined,
        )}
      </Serif>
      {!videoRecording && (
        <View pointerEvents="none" style={s.frame}>
          {["tl", "tr", "bl", "br"].map((c) => (
            <View
              key={c}
              style={[
                s.corner,
                c === "tl"
                  ? s.tl
                  : c === "tr"
                    ? s.tr
                    : c === "bl"
                      ? s.bl
                      : s.br,
              ]}
            />
          ))}
        </View>
      )}
      {!permission?.granted && !fixture && !videoRecording && (
        <View style={s.permission}>
          <Body style={{ color: "#ddd", textAlign: "center", lineHeight: 22 }}>
            {accessAction === "settings"
              ? "Camera access is off. Enable it in Settings, or choose a photo instead."
              : accessAction === "browser-settings"
                ? "Camera access is blocked in this browser. Change the site permission or choose a photo instead."
                : "Turn everyday things into new words."}
          </Body>
          {accessAction !== "browser-settings" && (
            <PillButton
              secondary
              style={{ marginTop: 16, minHeight: 44 }}
              onPress={handleCameraPermission}
            >
              {accessAction === "settings" ? "Open Settings" : "Enable camera"}
            </PillButton>
          )}
          <Pressable onPress={pick} style={{ padding: 15 }}>
            <Body style={{ color: "#ddd", textDecorationLine: "underline" }}>
              Choose a photo instead
            </Body>
          </Pressable>
        </View>
      )}
      {!videoRecording && (
        <Body style={s.frameHint}>
          Please place the object{`\n`}within the frame
        </Body>
      )}
      <View style={[s.bottomControls, s.captureBottomControls]}>
        <View
          pointerEvents={videoRecording ? "none" : "auto"}
          style={videoRecording ? s.invisibleControl : undefined}
        >
          <CircleButton
            label="Close camera"
            icon="close"
            size={captureDesign.liveCamera.controls.sideSize}
            background={captureDesign.liveCamera.controls.sideBackground}
            color="#fff"
            iconScale={captureDesign.liveCamera.controls.sideIconScale}
            onPress={() => navigate("home")}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          {!source034Fixture && (
            <View
              testID="camera-video-recording-hint"
              pointerEvents={videoRecording ? "none" : "auto"}
              style={[s.tooltip, videoRecording && s.invisibleControl]}
            >
              <View style={s.tooltipPointer} />
              <Body
                style={{
                  fontSize: captureDesign.liveCamera.videoTooltip.fontSize,
                  color: captureDesign.liveCamera.videoTooltip.textColor,
                }}
              >
                Long press to recognize video
              </Body>
            </View>
          )}
          <CameraRing
            size={
              videoRecording
                ? captureDesign.liveCamera.recording.ringSize
                : captureDesign.liveCamera.controls.shutterSize
            }
            artworkVariant="capture"
            busy={busy}
            disabled={videoRecording ? false : busy && cameraMode !== "video"}
            progress={videoRecording ? videoProgress : undefined}
            onPress={capture}
            onLongPress={startVideoCapture}
            onPressOut={stopVideoCapture}
            label={videoRecording ? "Recording video" : "Capture photo"}
            accessibilityHint={
              videoRecording
                ? "Release to stop video recording."
                : "Tap to capture a photo, or long press to recognize a video."
            }
          />
        </View>
        <View
          pointerEvents={videoRecording ? "none" : "auto"}
          style={videoRecording ? s.invisibleControl : undefined}
        >
          <CircleButton
            label="Choose image"
            icon="images-outline"
            size={captureDesign.liveCamera.controls.sideSize}
            background={captureDesign.liveCamera.controls.sideBackground}
            color="#fff"
            iconScale={captureDesign.liveCamera.controls.sideIconScale}
            onPress={pick}
          />
        </View>
      </View>
      <Sheet visible={!!error} onClose={() => setError("")} centered>
        <Serif style={{ fontSize: 24 }}>Camera unavailable</Serif>
        <Body style={{ marginVertical: 16, lineHeight: 22 }}>{error}</Body>
        <PillButton onPress={() => setError("")}>OK</PillButton>
      </Sheet>
    </Screen>
  );
}
export function ConfirmScreen({
  asset,
  onConfirm,
  onBack,
  busy = false,
  fullImageHint = false,
  recognitionGuidance = false,
  source035Fixture = false,
}: {
  asset: CaptureAsset;
  onConfirm: (asset: CaptureAsset) => void;
  onBack: () => void;
  busy?: boolean;
  fullImageHint?: boolean;
  recognitionGuidance?: boolean;
  source035Fixture?: boolean;
}) {
  const { height: viewportHeight, width: viewportWidth } =
    useWindowDimensions();
  const insets = useSafeAreaInsets();
  const guidanceDesign = captureDesign.recognitionGuidance;
  const source035Design = captureDesign.source035Preview;
  const fullImageDesign = captureDesign.fullImage;
  const fullImageActionDesign = fullImageDesign.action;
  const fullImageHintDesign = fullImageDesign.hint;
  const source035RingDiameter = viewportWidth * source035Design.diameterRatio;
  const contentTopInset = Platform.OS === "web" ? metrics.top : insets.top;
  const source035RingTop =
    (viewportHeight - source035RingDiameter) * source035Design.centerYRatio -
    contentTopInset;
  const confirmControls = source035Fixture
    ? source035Design.controls
    : captureDesign.confirmControls;
  const confirmControlIcons = source035Fixture
    ? confirmControlAssets.source035
    : confirmControlAssets.source012;
  const [current, setCurrent] = useState(asset),
    [editing, setEditing] = useState(false);
  const [fullImageMode, setFullImageMode] = useState(false),
    [hintVisible, setHintVisible] = useState(fullImageHint);
  const currentImageUri = imageUriForCapture(current);
  const originalImageUri = imageUriForCapture(asset);
  const fullPhotoPreview = fullImageMode || (fullImageHint && hintVisible);
  const imageActionSurface = fullImageMode
    ? {
        background: fullImageActionDesign.selectedBackground,
        color: fullImageActionDesign.selectedIconColor,
      }
    : fullImageHint && hintVisible
      ? {
          background: fullImageActionDesign.hintBackground,
          color: fullImageActionDesign.hintIconColor,
        }
      : {
          background: fullImageActionDesign.defaultBackground,
          color: fullImageActionDesign.defaultIconColor,
        };
  const confirmCurrentAsset = () => onConfirm(fullImageMode ? asset : current);
  const openCropEditor = () => {
    if (fullImageMode) setCurrent(asset);
    setFullImageMode(false);
    setEditing(true);
  };
  if (editing)
    return (
      <Screen background={cropEditorDesign.screenBackground} light>
        <CropEditor
          asset={current}
          onApply={(next) => {
            setCurrent({
              ...next,
              capturedAt:
                next.capturedAt ?? current.capturedAt ?? asset.capturedAt,
            });
            setFullImageMode(false);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Screen>
    );
  return (
    <Screen
      background={
        source035Fixture
          ? colors.black
          : recognitionGuidance
            ? colors.black
            : fullImageMode
              ? captureDesign.fullImage.background
              : captureDesign.confirmBackground
      }
      light
      bottomSafeArea={!recognitionGuidance}
      webBottomInset={recognitionGuidance ? 0 : metrics.bottom}
    >
      {fullPhotoPreview && (
        <Image
          testID="confirm-full-photo-preview"
          accessibilityLabel={
            fullImageMode
              ? recognitionGuidanceCopy.fullOriginalImageLabel
              : recognitionGuidanceCopy.selectedPhotoLabel
          }
          source={{ uri: originalImageUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={fullImageDesign.resizeMode}
        />
      )}
      <Serif
        style={[s.cameraDate, recognitionGuidance && s.recognitionGuidanceDate]}
      >
        {captureDateLabel(asset.capturedAt)}
      </Serif>
      {!recognitionGuidance && !source035Fixture && (
        <CircleButton
          label={
            fullImageMode
              ? recognitionGuidanceCopy.useCroppedImageLabel
              : recognitionGuidanceCopy.recognizeFullImageLabel
          }
          icon="image-outline"
          size={fullImageActionDesign.size}
          iconScale={fullImageActionDesign.iconScale}
          background={imageActionSurface.background}
          color={imageActionSurface.color}
          style={[
            s.fullImageButton,
            {
              top: fullImageActionDesign.topInset,
              right: fullImageActionDesign.rightInset,
            },
          ]}
          onPress={() => {
            setFullImageMode((value) => !value);
            setHintVisible(false);
          }}
        />
      )}
      {hintVisible &&
        !fullImageMode &&
        !recognitionGuidance &&
        !source035Fixture && (
          <>
            <View
              pointerEvents="none"
              style={[
                s.fullImageHintPointer,
                {
                  top: fullImageHintDesign.pointerTopInset,
                  right: fullImageHintDesign.pointerRightInset,
                  width: fullImageHintDesign.pointerSize,
                  height: fullImageHintDesign.pointerSize,
                },
              ]}
            />
            <View pointerEvents="none" style={s.fullImageHint}>
              <Body style={s.fullImageHintText}>
                {recognitionGuidanceCopy.fullImageHint}
              </Body>
            </View>
          </>
        )}
      <View
        style={[
          s.confirmStage,
          {
            paddingBottom: recognitionGuidance
              ? viewportHeight * guidanceDesign.card.stageBottomPaddingRatio
              : captureDesign.confirmStage.bottomPadding,
          },
        ]}
      >
        {source035Fixture ? null : recognitionGuidance ? (
          <View
            testID="confirm-guidance-polaroid"
            style={s.recognitionGuidancePolaroid}
          >
            <View style={s.recognitionGuidancePhoto} />
          </View>
        ) : (
          !fullPhotoPreview && (
            <View style={s.polaroid}>
              <Image
                source={{ uri: currentImageUri }}
                style={s.confirmPhoto}
                resizeMode="cover"
              />
            </View>
          )
        )}
        {asset.videoFrame && (
          <View testID="videoFrameDisclosure" style={s.videoFrameDisclosure}>
            <Body
              style={{
                color: "#fff",
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
              }}
            >
              This flow uses one still frame; full-video analysis is not
              connected.
            </Body>
          </View>
        )}
      </View>
      {source035Fixture && (
        <View
          testID="capture-preview-ring-035"
          style={[
            s.source035PreviewRing,
            {
              left: (viewportWidth - source035RingDiameter) / 2,
              top: source035RingTop,
              width: source035RingDiameter,
              height: source035RingDiameter,
              borderRadius: source035RingDiameter / 2,
              borderWidth: source035Design.borderWidth,
              borderColor: source035Design.borderColor,
            },
          ]}
        >
          <Image
            testID="source035-preview-media"
            source={require("../../assets/gummble-source-035-preview.png")}
            style={{
              width: source035RingDiameter - source035Design.borderWidth * 2,
              height: source035RingDiameter - source035Design.borderWidth * 2,
            }}
            resizeMode="cover"
          />
        </View>
      )}
      {busy ? (
        <View style={s.busy}>
          <CameraRing size={90} busy />
          <Body style={{ color: "#fff", marginTop: 16 }}>
            Preparing your word…
          </Body>
        </View>
      ) : recognitionGuidance ? (
        <RecognitionGuidanceSheet
          onRetake={onBack}
          onConfirm={confirmCurrentAsset}
          onCrop={openCropEditor}
        />
      ) : (
        <View
          style={[
            s.bottomControls,
            {
              paddingHorizontal: confirmControls.horizontalInset,
              bottom: confirmControls.bottomInset,
            },
          ]}
        >
          <CircleButton
            label="Retake image"
            iconSource={confirmControlIcons.rotate}
            iconArtworkSize={captureDesign.confirmControlArtwork.rotateFrame}
            size={confirmControls.sideSize}
            background={confirmControls.sideBackground}
            onPress={onBack}
          />
          <CircleButton
            label="Confirm object"
            iconSource={confirmControlIcons.checkmark}
            iconArtworkSize={captureDesign.confirmControlArtwork.checkmarkFrame}
            size={confirmControls.centerSize}
            onPress={confirmCurrentAsset}
          />
          <CircleButton
            label="Crop and rotate"
            iconSource={confirmControlIcons.crop}
            iconArtworkSize={captureDesign.confirmControlArtwork.cropFrame}
            size={confirmControls.sideSize}
            background={confirmControls.sideBackground}
            onPress={openCropEditor}
          />
        </View>
      )}
    </Screen>
  );
}
export function ResultScreen({
  result,
  capturedAt,
  onSave,
  onRetake,
  learningLanguage,
  preferredSpeechVoiceId,
}: {
  result: RecognitionResult;
  capturedAt?: number;
  onSave: (word: NewWord) => void | Promise<void>;
  onRetake: () => void;
  learningLanguage: string;
  preferredSpeechVoiceId?: string | null;
}) {
  const [word, setWord] = useState(result.word),
    [edit, setEdit] = useState(result.mode === "manual");
  const [manualNamed, setManualNamed] = useState(result.mode !== "manual");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveStarted = useRef(false);
  const canSave = manualNamed && !!word.target.trim() && !!word.native.trim();
  const save = async () => {
    if (!canSave || saveStarted.current) return;
    saveStarted.current = true;
    setSaving(true);
    try {
      await onSave({
        ...word,
        target: word.target.trim(),
        native: word.native.trim(),
      });
    } catch (error) {
      saveStarted.current = false;
      setSaving(false);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save this photo. Please try again.",
      );
    }
  };
  const hasLongTargetLabel =
    word.target.length >= resultDesign.target.longLabel.minimumCharacterCount;
  return (
    <Screen background={colors.onboarding}>
      <RecognitionResultBackdrop
        warmGlow={word.emoji !== STICKER_EMOJI.blackCircle}
      />
      <TopBar variant="result" onBack={() => !saving && onRetake()} />
      <Serif style={s.resultDate}>{captureDateLabel(capturedAt)}</Serif>
      <View style={s.resultArtwork}>
        <Sticker
          word={word}
          size={
            isFlowerStickerEmoji(word.emoji)
              ? resultDesign.artwork.flowerSize
              : resultDesign.artwork.size
          }
          style={s.resultSticker}
        />
        <View
          style={[
            s.resultTargetRow,
            hasLongTargetLabel && s.resultTargetRowLong,
          ]}
        >
          <Rounded
            style={[s.resultTarget, hasLongTargetLabel && s.resultTargetLong]}
          >
            {word.target}
          </Rounded>
          <ResultPronunciationButton
            text={word.target}
            language={learningLanguage}
            preferredVoiceId={preferredSpeechVoiceId}
            color={
              word.emoji === STICKER_EMOJI.blackCircle
                ? resultDesign.audio.color
                : word.emoji === STICKER_EMOJI.iceCream
                  ? resultDesign.audio.iceCreamColor
                  : word.color
            }
          />
        </View>
        <Body
          style={[s.resultNative, hasLongTargetLabel && s.resultNativeLong]}
        >
          {word.native}
        </Body>
      </View>
      <View style={s.resultActions}>
        <CircleButton
          label="Retake"
          icon="refresh"
          size={resultDesign.actions.sideSize}
          iconScale={resultDesign.actions.sideIconScale}
          color={resultDesign.actions.sideColor}
          disabled={saving}
          onPress={onRetake}
        />
        <CircleButton
          label="Save sticker"
          icon="checkmark"
          size={resultDesign.actions.centerSize}
          iconScale={resultDesign.actions.centerIconScale}
          color={resultDesign.actions.saveColor}
          disabled={!canSave || saving}
          onPress={save}
        />
        <CircleButton
          label="Discard"
          icon="close"
          size={resultDesign.actions.sideSize}
          iconScale={resultDesign.actions.sideIconScale}
          color={resultDesign.actions.sideColor}
          disabled={saving}
          onPress={onRetake}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Not what you expected? Tap to adjust"
        onPress={() => setEdit(true)}
        style={s.resultAdjust}
      >
        <Icon
          name="create-outline"
          size={resultDesign.adjustment.iconSize}
          color={resultDesign.adjustment.iconColor}
        />
        <Body style={s.resultAdjustCopy} numberOfLines={1}>
          Not what you expected? Tap to adjust
        </Body>
      </Pressable>
      {result.mode === "manual" && (
        <Body
          style={{
            margin: 24,
            textAlign: "center",
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Recognition service is not connected. Name this photo manually; it is
          not an AI result.
          {!manualNamed && " Add a name and meaning before saving."}
        </Body>
      )}
      {edit && (
        <ObjectNameEditor
          initialValue={manualNamed ? word : { ...word, native: "" }}
          manual={result.mode === "manual"}
          onCancel={() => setEdit(false)}
          onSave={(name) => {
            setWord((current) => ({ ...current, ...name }));
            setManualNamed(true);
            setEdit(false);
          }}
        />
      )}
      <Sheet visible={!!saveError} onClose={() => setSaveError("")} centered>
        <Serif style={{ fontSize: 24 }}>Could not save photo</Serif>
        <Body style={{ marginVertical: 16, lineHeight: 22 }}>{saveError}</Body>
        <PillButton onPress={() => setSaveError("")}>OK</PillButton>
      </Sheet>
    </Screen>
  );
}
const s = StyleSheet.create({
  cameraDate: {
    color: colors.white,
    fontSize: captureDesign.liveCamera.date.fontSize,
    marginLeft: captureDesign.liveCamera.date.marginLeft,
    marginTop: captureDesign.liveCamera.date.marginTop,
  },
  recognitionGuidanceDate: {
    fontSize: captureDesign.recognitionGuidance.dateFontSize,
  },
  frame: {
    position: "absolute",
    top: captureDesign.liveCamera.frame.top,
    left: captureDesign.liveCamera.frame.horizontalInset,
    right: captureDesign.liveCamera.frame.horizontalInset,
    height: captureDesign.liveCamera.frame.height,
  },
  corner: {
    width: captureDesign.liveCamera.frame.cornerSize,
    height: captureDesign.liveCamera.frame.cornerSize,
    position: "absolute",
    borderColor: colors.white,
  },
  tl: {
    left: 0,
    top: 0,
    borderLeftWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderTopWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderTopLeftRadius: captureDesign.liveCamera.frame.cornerRadius,
  },
  tr: {
    right: 0,
    top: 0,
    borderRightWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderTopWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderTopRightRadius: captureDesign.liveCamera.frame.cornerRadius,
  },
  bl: {
    left: 0,
    bottom: 0,
    borderLeftWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderBottomWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderBottomLeftRadius: captureDesign.liveCamera.frame.cornerRadius,
  },
  br: {
    right: 0,
    bottom: 0,
    borderRightWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderBottomWidth: captureDesign.liveCamera.frame.strokeWidth,
    borderBottomRightRadius: captureDesign.liveCamera.frame.cornerRadius,
  },
  frameHint: {
    position: "absolute",
    bottom: captureDesign.liveCamera.instruction.bottomInset,
    alignSelf: "center",
    textAlign: "center",
    color: colors.white,
    fontSize: captureDesign.liveCamera.instruction.fontSize,
    lineHeight: captureDesign.liveCamera.instruction.lineHeight,
  },
  bottomControls: {
    position: "absolute",
    bottom: captureDesign.confirmControls.bottomInset,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: captureDesign.confirmControls.horizontalInset,
  },
  captureBottomControls: {
    bottom: captureDesign.liveCamera.controls.bottomInset,
    paddingHorizontal: captureDesign.liveCamera.controls.horizontalInset,
  },
  invisibleControl: {
    opacity: 0,
  },
  tooltip: {
    position: "absolute",
    bottom: captureDesign.liveCamera.videoTooltip.bottomInset,
    backgroundColor: colors.white,
    borderRadius: captureDesign.liveCamera.videoTooltip.cornerRadius,
    paddingHorizontal: captureDesign.liveCamera.videoTooltip.horizontalPadding,
    paddingVertical: captureDesign.liveCamera.videoTooltip.verticalPadding,
    width: captureDesign.liveCamera.videoTooltip.width,
    alignItems: "center",
  },
  tooltipPointer: {
    position: "absolute",
    bottom: -captureDesign.liveCamera.videoTooltip.pointerSize / 2,
    width: captureDesign.liveCamera.videoTooltip.pointerSize,
    height: captureDesign.liveCamera.videoTooltip.pointerSize,
    backgroundColor: colors.white,
    transform: [{ rotate: "45deg" }],
  },
  permission: {
    position: "absolute",
    top: 290,
    alignSelf: "center",
    width: 245,
    alignItems: "center",
  },
  confirmStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  polaroid: {
    padding: captureDesign.polaroid.padding,
    paddingBottom: captureDesign.polaroid.bottomPadding,
    backgroundColor: colors.white,
    transform: [{ rotate: captureDesign.polaroid.rotation }],
    shadowColor: captureDesign.polaroid.shadowColor,
    shadowOpacity: captureDesign.polaroid.shadowOpacity,
    shadowRadius: captureDesign.polaroid.shadowRadius,
  },
  confirmPhoto: {
    width: captureDesign.polaroid.photoWidth,
    height: captureDesign.polaroid.photoHeight,
  },
  source035PreviewRing: {
    position: "absolute",
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  recognitionGuidancePolaroid: {
    width: captureDesign.recognitionGuidance.card.width,
    height: captureDesign.recognitionGuidance.card.height,
    paddingHorizontal: captureDesign.recognitionGuidance.card.paddingHorizontal,
    paddingTop: captureDesign.recognitionGuidance.card.paddingTop,
    paddingBottom: captureDesign.recognitionGuidance.card.paddingBottom,
    alignItems: "center",
    backgroundColor: colors.white,
    transform: [{ rotate: captureDesign.recognitionGuidance.card.rotation }],
  },
  recognitionGuidancePhoto: {
    width: captureDesign.recognitionGuidance.card.photoWidth,
    height: captureDesign.recognitionGuidance.card.photoHeight,
    backgroundColor: colors.black,
  },
  videoFrameDisclosure: {
    maxWidth: 290,
    marginTop: 14,
    paddingHorizontal: 10,
  },
  fullImageButton: {
    position: "absolute",
    zIndex: 3,
  },
  fullImageHint: {
    position: "absolute",
    zIndex: 2,
    top: captureDesign.fullImage.hint.topInset,
    right: captureDesign.fullImage.hint.rightInset,
    maxWidth: captureDesign.fullImage.hint.maxWidth,
    paddingHorizontal: captureDesign.fullImage.hint.horizontalPadding,
    paddingVertical: captureDesign.fullImage.hint.verticalPadding,
    borderRadius: captureDesign.fullImage.hint.cornerRadius,
    backgroundColor: captureDesign.fullImage.hint.background,
  },
  fullImageHintText: {
    fontSize: captureDesign.fullImage.hint.fontSize,
    lineHeight: captureDesign.fullImage.hint.lineHeight,
    color: captureDesign.fullImage.hint.textColor,
  },
  fullImageHintPointer: {
    position: "absolute",
    zIndex: 1,
    backgroundColor: captureDesign.fullImage.hint.background,
    transform: [{ rotate: captureDesign.fullImage.hint.pointerRotation }],
  },
  busy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
  },
  cropControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  resultDate: {
    fontSize: resultDesign.date.fontSize,
    paddingHorizontal: resultDesign.date.horizontalInset,
    color: resultDesign.date.color,
  },
  resultArtwork: {
    position: "relative",
    width: resultDesign.artwork.frameSize,
    height: resultDesign.artwork.frameSize,
    alignItems: "center",
    alignSelf: "center",
    marginTop: resultDesign.artwork.topGap,
  },
  resultSticker: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
  },
  resultTargetRow: {
    position: "absolute",
    top: resultDesign.target.top,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: resultDesign.target.audioGap,
    transform: [{ translateX: resultDesign.target.audioGroupOffsetX }],
  },
  resultTargetRowLong: {
    width: resultDesign.target.longLabel.rowWidth,
    transform: [{ translateX: resultDesign.target.longLabel.groupOffsetX }],
  },
  resultTarget: {
    backgroundColor: resultDesign.target.surface,
    borderRadius: resultDesign.target.radius,
    paddingHorizontal: resultDesign.target.horizontalPadding,
    fontSize: resultDesign.target.fontSize,
    lineHeight: resultDesign.target.lineHeight,
    color: resultDesign.target.color,
  },
  resultTargetLong: { fontSize: resultDesign.target.longLabel.fontSize },
  resultNative: {
    position: "absolute",
    top: resultDesign.native.top,
    alignSelf: "center",
    color: resultDesign.native.color,
    fontWeight: resultDesign.native.fontWeight,
    fontSize: resultDesign.native.fontSize,
  },
  resultNativeLong: { top: resultDesign.target.longLabel.nativeTop },
  resultAdjust: {
    alignSelf: "center",
    marginTop: resultDesign.adjustment.marginTop,
    width: resultDesign.adjustment.width,
    height: resultDesign.adjustment.height,
    paddingHorizontal: resultDesign.adjustment.horizontalPadding,
    backgroundColor: resultDesign.adjustment.surface,
    borderRadius: resultDesign.adjustment.radius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: resultDesign.adjustment.contentGap,
  },
  resultAdjustCopy: {
    fontSize: resultDesign.adjustment.fontSize,
    color: resultDesign.adjustment.textColor,
  },
  resultActions: {
    flexDirection: "row",
    gap: resultDesign.actions.gap,
    alignItems: "center",
    justifyContent: "center",
    marginTop: resultDesign.actions.marginTop,
  },
});
