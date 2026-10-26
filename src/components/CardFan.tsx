import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { DEMO_VOCABULARY } from "../data/demoVocabulary";
import { Word } from "../domain/types";
import { cardFanDesign, motion } from "../theme/tokens";
import { Sticker } from "./Sticker";
import { ReviewCardTexture } from "./ReviewCardTexture";

function fixtureWords(): Word[] {
  return DEMO_VOCABULARY.map((word, index) => ({
    ...word,
    id: `visual-${index}`,
    createdAt: "2025-09-11",
    review: { dueAt: "2025-09-12", intervalDays: 0, repetitions: 0 },
  }));
}

type CardFanPosition = {
  left?: number;
  top?: number;
  rotation?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  stickerSize?: number;
  texture?: "source021Paper";
};

type CardFanLayout = {
  scale: number;
  fanWidth: number;
  cardWidth: number;
  cardHeight: number;
  cardRadius: number;
  cardStep: number;
  cardTop: number;
  bottomInset: number;
  stickerSize: number;
  order: readonly number[];
  palette: readonly string[];
  rotations: readonly number[];
  positions?: readonly CardFanPosition[];
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
};

export function CardFan({
  words,
  animated = true,
  size,
  layout,
}: {
  words?: Word[];
  animated?: boolean;
  size?: number;
  layout?: CardFanLayout;
}) {
  const design: CardFanLayout = layout ?? cardFanDesign.default;
  const scale = size ?? design.scale;
  const raw = words?.length ? words : fixtureWords();
  const cards =
    raw.length >= 4
      ? design.order
          .map((index) => raw[index])
          .filter((word): word is Word => !!word)
      : raw;
  const [values] = useState(() =>
    Array.from({ length: 4 }, () => new Animated.Value(animated ? 0 : 1)),
  );

  useEffect(() => {
    if (animated) {
      Animated.stagger(
        motion.stagger,
        values.map((value) =>
          Animated.spring(value, {
            toValue: 1,
            ...motion.spring,
            useNativeDriver: true,
          }),
        ),
      ).start();
    } else {
      values.forEach((value) => value.setValue(1));
    }
  }, [animated, values]);

  const firstLeft =
    (design.fanWidth -
      (design.cardWidth + Math.max(0, cards.length - 1) * design.cardStep)) /
    2;
  return (
    <View
      style={{
        height: (design.cardHeight + design.bottomInset) * scale,
        width: design.fanWidth * scale,
        alignSelf: "center",
      }}
    >
      {cards.slice(0, 4).map((word, index) => {
        const position = design.positions?.[index];
        const cardWidth = position?.width ?? design.cardWidth;
        const cardHeight = position?.height ?? design.cardHeight;
        return (
          <Animated.View
            key={word.id}
            testID={`card-fan-card-${index}`}
            style={{
              position: "absolute",
              left:
                (position?.left ?? firstLeft + index * design.cardStep) * scale,
              top: (position?.top ?? design.cardTop) * scale,
              width: cardWidth * scale,
              height: cardHeight * scale,
              borderRadius: design.cardRadius * scale,
              backgroundColor:
                design.palette[index % design.palette.length] ??
                design.palette[0],
              alignItems: "center",
              justifyContent: "center",
              shadowColor: design.shadowColor,
              shadowOpacity: design.shadowOpacity,
              shadowRadius: design.shadowRadius,
              zIndex: position?.zIndex ?? index,
              overflow:
                position?.texture === "source021Paper" ? "hidden" : undefined,
              transform: [
                {
                  rotate: `${position?.rotation ?? design.rotations[index] ?? 0}deg`,
                },
                { scale: values[index] },
              ],
            }}
          >
            {position?.texture === "source021Paper" && <ReviewCardTexture />}
            <Sticker
              word={word}
              size={(position?.stickerSize ?? design.stickerSize) * scale}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}
