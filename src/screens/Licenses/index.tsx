import { Linking, ScrollView, Text, View } from 'react-native';

import ActionList from '../../components/ActionList';
import { ENGINE_SOURCE_URL } from '../../constants/engine';
import { makeStyles } from '../../theme';

const GPL_URL = 'https://www.gnu.org/licenses/gpl-3.0.html';
const OPENINGS_URL = 'https://github.com/lichess-org/chess-openings';

// Credit for the work the app builds on that isn't its own - with the
// engine's licence and where its source is, as the GPL asks of whoever
// hands it on.
const Licenses: React.FC = () => {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="licenses-screen"
    >
      <View style={styles.section}>
        <Text style={styles.title}>Stockfish</Text>
        <Text style={styles.body}>
          Analysis uses Stockfish 19, by the Stockfish developers, built for the
          web as stockfish.js by Nathan Rugg (the lite, single-threaded engine).
          It isn’t part of this app: it’s downloaded the first time you open
          Analysis, then kept on your device. Stockfish is free software under
          the GNU General Public License, version 3.
        </Text>
      </View>
      <ActionList
        items={[
          {
            label: 'Stockfish source code',
            icon: 'source-branch',
            onPress: () => Linking.openURL(ENGINE_SOURCE_URL),
            testID: 'license-engine-source',
          },
          {
            label: 'GNU GPL, version 3',
            icon: 'file-document-outline',
            onPress: () => Linking.openURL(GPL_URL),
            testID: 'license-gpl',
          },
        ]}
      />
      <View style={styles.section}>
        <Text style={styles.title}>Opening names</Text>
        <Text style={styles.body}>
          The names of openings come from lichess.org’s opening list, which is
          dedicated to the public domain (CC0).
        </Text>
      </View>
      <ActionList
        items={[
          {
            label: 'lichess-org/chess-openings',
            icon: 'source-branch',
            onPress: () => Linking.openURL(OPENINGS_URL),
            testID: 'license-openings',
          },
        ]}
      />
    </ScrollView>
  );
};

export default Licenses;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingVertical: t.spacing.lg,
    gap: t.spacing.md,
  },
  section: {
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.sm,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
  },
  body: {
    fontSize: t.fontSize.base,
    lineHeight: 20,
    color: t.colors.textMuted,
  },
}));
