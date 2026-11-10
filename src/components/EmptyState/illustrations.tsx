import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '../../theme';

interface IllustrationProps {
  size: number;
}

// Two people, one waving in from the side with a "+" badge.
const Friends: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Circle cx={46} cy={40} r={12} fill={colors.illustration.grey} />
      <Path
        d="M24 76c0-13 10-22 22-22s22 9 22 22z"
        fill={colors.illustration.grey}
      />
      <Circle cx={72} cy={36} r={14} fill={colors.accent} />
      <Path d="M46 76c0-15 12-26 26-26s26 11 26 26z" fill={colors.accent} />
      <Circle
        cx={96}
        cy={24}
        r={11}
        fill={colors.background}
        stroke={colors.accent}
        strokeWidth={3}
      />
      <Path
        d="M96 19v10M91 24h10"
        stroke={colors.accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
};

// A corner of a board with a lone pawn waiting for a game.
const Games: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();

  const squares = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      squares.push(
        <Rect
          key={`${row}-${col}`}
          x={28 + col * 16}
          y={34 + row * 16}
          width={16}
          height={16}
          fill={
            (row + col) % 2 === 0 ? colors.illustration.light : colors.accent
          }
        />,
      );
    }
  }
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <G>{squares}</G>
      <G transform="translate(60 4)">
        <Circle cx={0} cy={12} r={8} fill={colors.illustration.dark} />
        <Path d="M-6 20h12l4 16h-20z" fill={colors.illustration.dark} />
        <Rect
          x={-13}
          y={36}
          width={26}
          height={6}
          rx={3}
          fill={colors.illustration.dark}
        />
      </G>
    </Svg>
  );
};

// Two speech bubbles, the reply still being typed.
const Messages: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Path
        d="M22 26h48a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8H38l-10 9v-9h-6a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z"
        fill={colors.illustration.grey}
      />
      <Path
        d="M30 40h32M30 49h20"
        stroke={colors.background}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M58 50h42a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-4v8l-10-8H58a8 8 0 0 1-8-8V58a8 8 0 0 1 8-8z"
        fill={colors.accent}
      />
      <Circle cx={68} cy={66} r={3.5} fill={colors.background} />
      <Circle cx={79} cy={66} r={3.5} fill={colors.background} />
      <Circle cx={90} cy={66} r={3.5} fill={colors.background} />
    </Svg>
  );
};

// A short bar chart, all bars still empty but one.
const Activity: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Rect
        x={30}
        y={56}
        width={12}
        height={22}
        rx={3}
        fill={colors.illustration.grey}
      />
      <Rect
        x={48}
        y={44}
        width={12}
        height={34}
        rx={3}
        fill={colors.illustration.grey}
      />
      <Rect x={66} y={28} width={12} height={50} rx={3} fill={colors.accent} />
      <Rect
        x={84}
        y={50}
        width={12}
        height={28}
        rx={3}
        fill={colors.illustration.grey}
      />
      <Path
        d="M24 80h78"
        stroke={colors.illustration.dark}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
};

// A quiet bell with a check: nothing waiting.
const Notifications: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Path
        d="M60 18c-14 0-24 11-24 25v15l-7 10h62l-7-10V43c0-14-10-25-24-25z"
        fill={colors.illustration.grey}
      />
      <Path d="M52 72a8 8 0 0 0 16 0z" fill={colors.illustration.grey} />
      <Circle cx={84} cy={26} r={12} fill={colors.accent} />
      <Path
        d="M78 26l4 4 8-8"
        stroke={colors.background}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// A pawn whose way forward forks: their move either way, and the reply
// waiting at the end of each - one picked out.
const Branches: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Path
        d="M60 66V50M60 50L38 30M60 50l22-20"
        stroke={colors.illustration.grey}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={36} cy={27} r={9} fill={colors.illustration.grey} />
      <Circle cx={84} cy={27} r={9} fill={colors.accent} />
      <Path
        d="M80 27l3 3 6-6"
        stroke={colors.background}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <G transform="translate(60 64)">
        <Circle cx={0} cy={4} r={6} fill={colors.illustration.dark} />
        <Path d="M-4 10h8l3 10h-14z" fill={colors.illustration.dark} />
        <Rect
          x={-10}
          y={20}
          width={20}
          height={5}
          rx={2.5}
          fill={colors.illustration.dark}
        />
      </G>
    </Svg>
  );
};

// A jigsaw piece with a pawn on it, a spark beside it - the "aha" of a
// puzzle solved.
const Puzzles: React.FC<IllustrationProps> = ({ size }) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 120 96">
      <Circle cx={60} cy={52} r={40} fill={colors.illustration.pale} />
      <Path
        d="M34 34h14a8 8 0 1 1 16 0h14v14a8 8 0 1 1 0 16v14H64a8 8 0 1 0-16 0H34V64a8 8 0 1 0 0-16z"
        fill={colors.accent}
      />
      <G transform="translate(56 50)">
        <Circle cx={0} cy={-6} r={5} fill={colors.background} />
        <Path d="M-3.5 -1h7l2.5 9h-12z" fill={colors.background} />
        <Rect
          x={-8}
          y={8}
          width={16}
          height={4}
          rx={2}
          fill={colors.background}
        />
      </G>
      <Path
        d="M96 14v12M90 20h12M92 16l8 8M100 16l-8 8"
        stroke={colors.illustration.dark}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ILLUSTRATIONS = {
  friends: Friends,
  games: Games,
  messages: Messages,
  activity: Activity,
  notifications: Notifications,
  branches: Branches,
  puzzles: Puzzles,
} satisfies Record<string, React.FC<IllustrationProps>>;

export type IllustrationName = keyof typeof ILLUSTRATIONS;
