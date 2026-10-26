import React from "react";
import { StyleSheet, View } from "react-native";
import { collectionSaveCopy } from "../data/collectionSaveReference";
import { collectionInlineActionsDesign } from "../theme/tokens";
import { Body, CircleButton } from "./UI";

type CollectionTileActionsProps = {
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  showSaveAction: boolean;
  error?: string;
};

export function CollectionTileActions({
  onSave,
  onDelete,
  saving,
  showSaveAction,
  error,
}: CollectionTileActionsProps) {
  return (
    <View
      pointerEvents="box-none"
      style={s.actions}
      testID="collection-inline-actions"
    >
      {showSaveAction && (
        <CircleButton
          background={collectionInlineActionsDesign.actionSurface}
          color={collectionInlineActionsDesign.downloadColor}
          disabled={saving}
          icon="download"
          iconScale={collectionInlineActionsDesign.actionIconScale}
          label={
            saving
              ? collectionSaveCopy.savingAction
              : collectionSaveCopy.saveAction
          }
          onPress={onSave}
          size={collectionInlineActionsDesign.actionSize}
          style={s.actionButton}
        />
      )}
      <CircleButton
        background={collectionInlineActionsDesign.actionSurface}
        color={collectionInlineActionsDesign.deleteColor}
        icon="trash"
        iconScale={collectionInlineActionsDesign.actionIconScale}
        label={collectionSaveCopy.deleteWord}
        onPress={onDelete}
        size={collectionInlineActionsDesign.actionSize}
        style={s.actionButton}
      />
      {error ? <Body style={s.error}>{error}</Body> : null}
    </View>
  );
}

const s = StyleSheet.create({
  actions: {
    position: "absolute",
    top: collectionInlineActionsDesign.actionStackTopOffset,
    right: collectionInlineActionsDesign.actionRightInset,
    zIndex: collectionInlineActionsDesign.layer,
    alignItems: "center",
    gap: collectionInlineActionsDesign.actionGap,
  },
  actionButton: {
    shadowColor: collectionInlineActionsDesign.shadowColor,
    shadowOpacity: collectionInlineActionsDesign.shadowOpacity,
    shadowRadius: collectionInlineActionsDesign.shadowRadius,
    shadowOffset: collectionInlineActionsDesign.shadowOffset,
    elevation: collectionInlineActionsDesign.elevation,
  },
  error: {
    width: collectionInlineActionsDesign.errorWidth,
    marginTop: collectionInlineActionsDesign.errorMarginTop,
    color: collectionInlineActionsDesign.errorColor,
    fontSize: collectionInlineActionsDesign.errorFontSize,
    lineHeight: collectionInlineActionsDesign.errorLineHeight,
    textAlign: "center",
  },
});
