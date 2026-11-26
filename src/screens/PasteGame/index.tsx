import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import { parseImport } from '../../domain/pgnImport';
import { MenuStackScreenProps } from '../MenuStack/types';
import { makeStyles, useTheme } from '../../theme';

type PasteGameProps = {
  navigation: Pick<MenuStackScreenProps<'PasteGame'>['navigation'], 'navigate'>;
};

// More characters arriving at once than this is a paste.
const PASTE_LENGTH = 10;
// The native stack's header, under the status bar - for how far the
// keyboard comes up the screen.
const HEADER_HEIGHT = 44;

// A game or a position pasted in - a PGN or a FEN - to analyse.
const PasteGame: React.FC<PasteGameProps> = ({ navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  function analyse() {
    const result = parseImport(text);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    navigation.navigate('AnalysisBoard', {
      source: {
        kind: 'import',
        startFen: result.startFen,
        uciMoves: result.uciMoves,
        ...(result.game && { game: result.game }),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="paste-game"
      >
        <TextInput
          value={text}
          onChangeText={(next) => {
            // A paste - more at once than typing brings - puts the keyboard
            // away, to see what came in; a tap on the field brings it back.
            if (next.length - text.length > PASTE_LENGTH) Keyboard.dismiss();
            setText(next);
            setError(null);
          }}
          placeholder={'[Event "…"]\n1. e4 e5 2. Nf3 …\n\nor a FEN'}
          placeholderTextColor={colors.textFaint}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={styles.input}
          accessibilityLabel="PGN or FEN"
          testID="paste-game-input"
        />
        {error && (
          <Text style={styles.error} testID="paste-game-error">
            {error}
          </Text>
        )}
        <Text style={styles.hint}>
          A PGN&apos;s main line is analysed; its variations and comments
          aren&apos;t brought in.
        </Text>
      </ScrollView>
      {/* Pinned under what's pasted, however long - and over the keyboard
          while it's up - so it's never scrolled out of reach. */}
      <View style={styles.footer}>
        <Button
          label="Analyse"
          onPress={analyse}
          disabled={!text.trim()}
          variant="primary"
          testID="paste-game-analyse"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default PasteGame;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  scroll: {
    flex: 1,
  },
  footer: {
    padding: t.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.separator,
  },
  content: {
    padding: t.spacing.lg,
    gap: t.spacing.md,
  },
  input: {
    color: t.colors.text,
    minHeight: 180,
    borderRadius: t.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.separator,
    backgroundColor: t.colors.surfaceSubtle,
    padding: t.spacing.md,
    fontSize: t.fontSize.base,
    fontFamily: 'Menlo',
    textAlignVertical: 'top',
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.base,
  },
  hint: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.md,
  },
}));
