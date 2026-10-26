import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as Manipulator from "expo-image-manipulator";
import { cropEditorCopy } from "../data/cropEditorCopy";
import {
  cropRatioOptions,
  CropRatioId,
  defaultCropRatioId,
} from "../data/cropRatios";
import { CaptureAsset } from "../services/recognition";
import { imageUriForCapture } from "../services/captureImage";
import { cropEditorDesign } from "../theme/tokens";
import { ArtworkActionButton } from "./ArtworkActionButton";
import { CropFrameOverlay } from "./CropFrameOverlay";
import { ActionSheet, Body, CircleButton, PillButton, Sheet } from "./UI";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const cropEditorAssets = {
  guide: require("../../assets/crop-editor/crop-guide-054.png"),
  rotateLeft: require("../../assets/crop-editor/rotate-left-011.png"),
  reset: require("../../assets/crop-editor/reset-crop-011.png"),
  ratio: require("../../assets/crop-editor/select-ratio-011.png"),
  ratioSelected: require("../../assets/crop-editor/select-ratio-active-054.png"),
  rotateRight: require("../../assets/crop-editor/rotate-right-011.png"),
} as const;

type CropEditorProps = {
  asset: CaptureAsset;
  onApply: (asset: CaptureAsset) => void;
  onCancel: () => void;
};

export function CropEditor({ asset, onApply, onCancel }: CropEditorProps) {
  const [current, setCurrent] = useState(asset);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState<number>(cropEditorDesign.zoom.minimum);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ratioId, setRatioId] = useState<CropRatioId>(defaultCropRatioId);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ratioToolSelected, setRatioToolSelected] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const sourceUri = useMemo(() => {
    try {
      return imageUriForCapture(current);
    } catch {
      return current.uri;
    }
  }, [current]);

  useEffect(() => {
    Image.getSize(
      sourceUri,
      (width, height) => {
        setDimensions({ width, height });
        setZoom(cropEditorDesign.zoom.minimum);
        setOffset({ x: 0, y: 0 });
      },
      () => setError(cropEditorCopy.imageLoadError),
    );
  }, [sourceUri]);

  const selectedRatio =
    cropRatioOptions.find((option) => option.id === ratioId) ??
    cropRatioOptions[0];
  const ratio = selectedRatio.aspectRatio ?? dimensions.width / dimensions.height;
  const width = Math.min(
    cropEditorDesign.frame.maximumWidth,
    cropEditorDesign.frame.widthBasis * ratio,
  );
  const height = width / ratio;
  const base = Math.max(width / dimensions.width, height / dimensions.height);
  const scale = base * zoom;
  const imageW = dimensions.width * scale;
  const imageH = dimensions.height * scale;
  const bounds = {
    x: Math.max(0, (imageW - width) / 2),
    y: Math.max(0, (imageH - height) / 2),
  };

  // Gesture handlers read refs only during pointer events, never during render.
  const responder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- This reference is only read from gesture event handlers.
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = offset;
          setInteracting(true);
        },
        onPanResponderMove: (_, gesture) =>
          setOffset({
            x: clamp(start.current.x + gesture.dx, -bounds.x, bounds.x),
            y: clamp(start.current.y + gesture.dy, -bounds.y, bounds.y),
          }),
        onPanResponderRelease: () => setInteracting(false),
        onPanResponderTerminate: () => setInteracting(false),
      }),
    [offset, bounds.x, bounds.y],
  );

  const changeZoom = (delta: number) => {
    setZoom((value) =>
      clamp(
        value + delta,
        cropEditorDesign.zoom.minimum,
        cropEditorDesign.zoom.maximum,
      ),
    );
    setOffset({ x: 0, y: 0 });
  };

  const manipulate = async (action: Manipulator.Action) => {
    setBusy(true);
    try {
      const next = await Manipulator.manipulateAsync(sourceUri, [action], {
        compress: cropEditorDesign.processing.transformQuality,
        format: Manipulator.SaveFormat.JPEG,
        base64: true,
      });
      setCurrent({ uri: next.uri, base64: next.base64, mimeType: "image/jpeg" });
    } catch {
      setError(cropEditorCopy.transformError);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const cropWidth = Math.min(dimensions.width, Math.round(width / scale));
      const cropHeight = Math.min(dimensions.height, Math.round(height / scale));
      const originX = clamp(
        Math.round(((imageW - width) / 2 - offset.x) / scale),
        0,
        dimensions.width - cropWidth,
      );
      const originY = clamp(
        Math.round(((imageH - height) / 2 - offset.y) / scale),
        0,
        dimensions.height - cropHeight,
      );
      const next = await Manipulator.manipulateAsync(
        sourceUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        {
          compress: cropEditorDesign.processing.cropQuality,
          format: Manipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      onApply({ uri: next.uri, base64: next.base64, mimeType: "image/jpeg" });
    } catch {
      setError(cropEditorCopy.cropError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Image
        pointerEvents="none"
        accessible={false}
        source={cropEditorAssets.guide}
        resizeMode="contain"
        style={{
          position: "absolute",
          top: cropEditorDesign.instruction.iconTopInset,
          width: cropEditorDesign.instruction.iconSize.width,
          height: cropEditorDesign.instruction.iconSize.height,
        }}
      />
      <Body
        style={{
          color: cropEditorDesign.instruction.color,
          fontSize: cropEditorDesign.instruction.fontSize,
          lineHeight: cropEditorDesign.instruction.lineHeight,
          textAlign: "center",
          marginTop: cropEditorDesign.instruction.topMargin,
        }}
      >
        {cropEditorCopy.instruction}
      </Body>

      <View
        {...responder.panHandlers}
        testID="crop-editor-frame"
        style={{
          width,
          height,
          position: "relative",
          marginTop: cropEditorDesign.frame.topMargin,
          backgroundColor: cropEditorDesign.frame.backgroundColor,
        }}
      >
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            {
              overflow: "hidden",
              borderWidth: cropEditorDesign.frame.borderWidth,
              borderColor: ratioToolSelected
                ? cropEditorDesign.frame.selectedBorderColor
                : cropEditorDesign.frame.defaultBorderColor,
              backgroundColor: cropEditorDesign.frame.backgroundColor,
            },
          ]}
        >
          <Image
            pointerEvents="none"
            testID="crop-editor-preview"
            source={{ uri: sourceUri }}
            style={{
              position: "absolute",
              width: imageW,
              height: imageH,
              left: (width - imageW) / 2 + offset.x,
              top: (height - imageH) / 2 + offset.y,
            }}
          />
        </View>
        <CropFrameOverlay
          showCorners={true}
          showGrid={interacting}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: cropEditorDesign.zoom.rowGap,
          alignItems: "center",
          marginTop: cropEditorDesign.zoom.rowTopMargin,
        }}
      >
        <CircleButton
          label={cropEditorCopy.zoomOut}
          icon="remove"
          size={cropEditorDesign.zoom.buttonSize}
          background={cropEditorDesign.zoom.buttonSurface}
          color={cropEditorDesign.zoom.buttonIconColor}
          onPress={() => changeZoom(-cropEditorDesign.zoom.step)}
        />
        <Body
          style={{
            color: cropEditorDesign.zoom.valueColor,
            fontSize: cropEditorDesign.zoom.valueFontSize,
          }}
        >
          {zoom.toFixed(cropEditorDesign.zoom.decimals)}
          {cropEditorCopy.zoomMultiplierSuffix}
        </Body>
        <CircleButton
          label={cropEditorCopy.zoomIn}
          icon="add"
          size={cropEditorDesign.zoom.buttonSize}
          background={cropEditorDesign.zoom.buttonSurface}
          color={cropEditorDesign.zoom.buttonIconColor}
          onPress={() => changeZoom(cropEditorDesign.zoom.step)}
        />
      </View>

      <View
        style={{
          position: "absolute",
          bottom: cropEditorDesign.confirmation.bottomInset,
          alignItems: "center",
          width: "100%",
        }}
      >
        <PillButton
          secondary
          disabled={busy || dimensions.width === 1}
          style={{
            height: cropEditorDesign.confirmation.height,
            minHeight: cropEditorDesign.confirmation.height,
            width: cropEditorDesign.confirmation.width,
          }}
          onPress={apply}
        >
          {busy ? cropEditorCopy.preparing : cropEditorCopy.confirmSelection}
        </PillButton>
        <Pressable
          onPress={onCancel}
          style={{
            padding: cropEditorDesign.cancel.padding,
            marginTop: cropEditorDesign.cancel.topMargin,
          }}
        >
          <Body
            style={{
              color: cropEditorDesign.instruction.color,
              fontSize: cropEditorDesign.cancel.fontSize,
            }}
          >
            {cropEditorCopy.cancel}
          </Body>
        </Pressable>
        <View
          style={{
            flexDirection: "row",
            width: cropEditorDesign.toolbar.width,
            justifyContent: "space-between",
            paddingTop: cropEditorDesign.toolbar.topPadding,
            transform: [
              { translateX: cropEditorDesign.toolbar.centerOffsetX },
            ],
          }}
        >
          <ArtworkActionButton
            label={cropEditorCopy.rotateLeft}
            source={cropEditorAssets.rotateLeft}
            iconSize={cropEditorDesign.toolbar.iconFrames.rotateLeft}
            hitSlop={cropEditorDesign.toolbar.hitSlop}
            disabled={busy}
            testID="crop-action-rotate-left"
            onPress={() => void manipulate({ rotate: -90 })}
          />
          <ArtworkActionButton
            label={cropEditorCopy.resetCrop}
            source={cropEditorAssets.reset}
            iconSize={cropEditorDesign.toolbar.iconFrames.reset}
            hitSlop={cropEditorDesign.toolbar.hitSlop}
            disabled={busy}
            testID="crop-action-reset"
            onPress={() => {
              setCurrent(asset);
              setRatioId(defaultCropRatioId);
              setRatioToolSelected(false);
              setZoom(cropEditorDesign.zoom.minimum);
              setOffset({ x: 0, y: 0 });
            }}
          />
          <ArtworkActionButton
            label={cropEditorCopy.selectRatio}
            hint={cropEditorCopy.currentRatioHint(selectedRatio.label)}
            source={
              ratioToolSelected
                ? cropEditorAssets.ratioSelected
                : cropEditorAssets.ratio
            }
            iconSize={cropEditorDesign.toolbar.iconFrames.selectRatio}
            hitSlop={cropEditorDesign.toolbar.hitSlop}
            selected={ratioToolSelected}
            disabled={busy}
            testID="crop-action-select-ratio"
            onPress={() => {
              setRatioToolSelected(true);
              setPicker(true);
            }}
          />
          <ArtworkActionButton
            label={cropEditorCopy.rotateRight}
            source={cropEditorAssets.rotateRight}
            iconSize={cropEditorDesign.toolbar.iconFrames.rotateRight}
            hitSlop={cropEditorDesign.toolbar.hitSlop}
            disabled={busy}
            testID="crop-action-rotate-right"
            onPress={() => void manipulate({ rotate: 90 })}
          />
        </View>
      </View>

      {busy && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: cropEditorDesign.loading.overlay,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator color={cropEditorDesign.loading.indicatorColor} />
        </View>
      )}

      <ActionSheet
        visible={picker}
        onClose={() => setPicker(false)}
        options={cropRatioOptions.map((option) => ({
          id: option.id,
          label: option.label,
          onPress: () => {
            setRatioId(option.id);
            setRatioToolSelected(true);
            setZoom(cropEditorDesign.zoom.minimum);
            setOffset({ x: 0, y: 0 });
            setPicker(false);
          },
        }))}
      />
      <Sheet visible={!!error} onClose={() => setError("")} centered>
        <Body
          style={{
            lineHeight: cropEditorDesign.instruction.lineHeight,
            marginBottom: cropEditorDesign.errorSheet.actionBottomMargin,
          }}
        >
          {error}
        </Body>
        <PillButton onPress={() => setError("")}>{cropEditorCopy.dismissError}</PillButton>
      </Sheet>
    </View>
  );
}
