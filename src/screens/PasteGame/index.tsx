import { useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import Button from '../../components/Button';
import { MUTED_COLOR } from '../../constants/colors';
import { parseImport } from '../../domain/pgnImport';
import { AnalysisStackScreenProps } from '../AnalysisStack/types';

type PasteGameProps = {
  navigation: Pick<
    AnalysisStackScreenProps<'PasteGame'>['navigation'],
    'navigate'
  >;
};

// More characters arriving at once than this is a paste.
const PASTE_LENGTH = 10;

// A game or a position pasted in - a PGN or a FEN - to analyse.
const PasteGame: React.FC<PasteGameProps> = ({ navigation }) => {
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
      },
    });
  }

  return (
    <ScrollView
      style={styles.screen}
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
        placeholderTextColor="#aaa"
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
        A PGN’s main line is analysed; its variations and comments aren’t
        brought in.
      </Text>
      <Button
        label="Analyse"
        onPress={analyse}
        disabled={!text.trim()}
        variant="primary"
        testID="paste-game-analyse"
      />
    </ScrollView>
  );
};

export default PasteGame;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  input: {
    minHeight: 180,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c8c8',
    backgroundColor: '#fafafa',
    padding: 12,
    fontSize: 14,
    fontFamily: 'Menlo',
    textAlignVertical: 'top',
  },
  error: {
    color: '#c62828',
    fontSize: 14,
  },
  hint: {
    color: MUTED_COLOR,
    fontSize: 13,
  },
});
