import { Color, PieceSymbol, Square } from "chess.js";
import { Animated } from "react-native/types";

export type Position = {
  x: number;
  y: number;
};

export type PieceDetails = {
  square: Square;
  type: PieceSymbol;
  color: Color;
  animatedPosition: Animated.ValueXY;
  key: string;
  id: `${Color}${PieceSymbol}`,
  captured: boolean;
  position: Position;
} | null;

