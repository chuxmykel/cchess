import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MUTED_COLOR } from '../../constants/colors';
import { EngineStatus } from '../../context/EngineContext';
import { EngineAnalysis, EngineLineView } from '../../hooks/useEngineAnalysis';

interface EngineLinesProps {
  status: EngineStatus['kind'];
  downloadProgress?: number;
  analysis: EngineAnalysis;
  onRetry: () => void;
  // A line tapped: its first move, to play on the board.
  onPlayLine?: (line: EngineLineView) => void;
}

// The engine's best lines: each one's score, then its moves - tapped, its
// first move is played. A new position's lines take a moment, so the last
// position's stay till then, greyed out and not to be tapped. While there's
// no engine yet, what's happening to it instead - downloading the first
// time, starting, or failed, with a way to try again.
// Each line's height, and the depth's under them - for a screen to keep the
// lines' room the same however many there are yet.
export const LINE_HEIGHT = 26;
export const DEPTH_HEIGHT = 14;

const EngineLines: React.FC<EngineLinesProps> = ({
  status,
  downloadProgress = 0,
  analysis,
  onRetry,
  onPlayLine,
}) => {
  if (status === 'error') {
    return (
      <View style={styles.message} testID="engine-error">
        <Text style={styles.messageText}>{"The engine couldn't start."}</Text>
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          testID="engine-retry"
        >
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (status === 'downloading') {
    return (
      <View style={styles.message} testID="engine-downloading">
        <Text style={styles.messageText}>
          {`Downloading engine… ${Math.round(downloadProgress * 100)}%`}
        </Text>
      </View>
    );
  }
  if (status !== 'ready' || analysis.status === 'off') {
    return (
      <View style={styles.message} testID="engine-starting">
        <Text style={styles.messageText}>
          {status === 'ready' ? '' : 'Starting engine…'}
        </Text>
      </View>
    );
  }
  return (
    <View testID="engine-lines">
      {analysis.lines.length === 0 ? (
        <View style={styles.line}>
          <Text style={styles.messageText}>Thinking…</Text>
        </View>
      ) : (
        analysis.lines.map((line, index) => (
          <Pressable
            key={index}
            style={[styles.line, analysis.stale && styles.stale]}
            onPress={() => onPlayLine?.(line)}
            disabled={analysis.stale || !onPlayLine}
            accessibilityRole="button"
            accessibilityState={{ disabled: analysis.stale }}
            testID={`engine-line-${index}`}
          >
            <View style={styles.chip}>
              <Text
                style={styles.chipText}
                testID={`engine-line-${index}-score`}
              >
                {line.formatted}
              </Text>
            </View>
            {/* As much of the line as fits, cut off at the edge. */}
            <Text style={styles.moves} numberOfLines={1} ellipsizeMode="clip">
              {line.moves.map(({ label, san }, at) => (
                <Text key={at}>
                  {at > 0 ? ' ' : ''}
                  {label && <Text style={styles.number}>{`${label} `}</Text>}
                  {san}
                </Text>
              ))}
            </Text>
          </Pressable>
        ))
      )}
      <Text style={styles.depth} testID="engine-depth">
        {analysis.stale ? '' : `Depth ${analysis.depth}`}
      </Text>
    </View>
  );
};

export default EngineLines;

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: LINE_HEIGHT,
  },
  // Lighter than the moves, so they stand out from them.
  number: {
    color: MUTED_COLOR,
  },
  stale: {
    opacity: 0.4,
  },
  chip: {
    minWidth: 52,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ececec',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#222',
  },
  moves: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  depth: {
    alignSelf: 'flex-end',
    paddingRight: 12,
    height: DEPTH_HEIGHT,
    fontSize: 10,
    color: MUTED_COLOR,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    height: LINE_HEIGHT + DEPTH_HEIGHT,
  },
  messageText: {
    fontSize: 13,
    color: MUTED_COLOR,
  },
  retry: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2a7ae2',
  },
});
