import React from "react";
import { StyleSheet, View } from "react-native";
import { cropEditorDesign } from "../theme/tokens";

type CropFrameOverlayProps = {
  showCorners: boolean;
  showGrid: boolean;
};

export function CropFrameOverlay({
  showCorners,
  showGrid,
}: CropFrameOverlayProps) {
  const { frame } = cropEditorDesign;
  const divisions = Array.from(
    { length: frame.gridDivisions - 1 },
    (_, index) => (index + 1) / frame.gridDivisions,
  );
  const cornerPositions = [
    { key: "top-left", position: { left: 0, top: -frame.corner.overlap } },
    { key: "top-right", position: { right: 0, top: -frame.corner.overlap } },
    { key: "bottom-left", position: { left: 0, bottom: -frame.corner.overlap } },
    { key: "bottom-right", position: { right: 0, bottom: -frame.corner.overlap } },
  ];

  return (
    <>
      {showCorners && (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          testID="crop-frame-corners"
        >
          {cornerPositions.map(({ key, position }) => (
            <View
              key={key}
              style={[
                styles.corner,
                {
                  width: frame.corner.length,
                  height: frame.corner.thickness,
                  backgroundColor: frame.selectedBorderColor,
                },
                position,
              ]}
            />
          ))}
        </View>
      )}
      {showGrid && (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          testID="crop-editor-grid"
        >
          {divisions.map((position) => (
            <React.Fragment key={position}>
              <View
                style={{
                  position: "absolute",
                  left: `${position * 100}%`,
                  height: "100%",
                  width: frame.gridLineWidth,
                  backgroundColor: frame.gridColor,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: `${position * 100}%`,
                  width: "100%",
                  height: frame.gridLineWidth,
                  backgroundColor: frame.gridColor,
                }}
              />
            </React.Fragment>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  corner: { position: "absolute" },
});
