import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import BottomBar from '../../components/BottomBar';
import { ToolbarButton } from '../../components/GameToolbar';
import PositionEditor from '../../components/PositionEditor';
import PositionSetupSheet from '../../components/PositionSetupSheet';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { usePositionEditor } from '../../hooks/usePositionEditor';
import { makeStyles } from '../../theme';

interface SetUpPositionViewProps {
  initialFen?: string;
  width: number;
  onAnalyse: (fen: string) => void;
  // Back to the analysis it was opened from; left out when there's none.
  onCancel?: () => void;
}

// Setting up a position to analyse: the editor, and a toolbar of its own -
// a menu (start again from the usual position or an empty board; cancel, over
// an analysis), flip the board, Analyse, and the rest of the position (whose
// move, castling) in a sheet.
const SetUpPositionView: React.FC<SetUpPositionViewProps> = ({
  initialFen,
  width,
  onAnalyse,
  onCancel,
}) => {
  const styles = useStyles();

  const editor = usePositionEditor(initialFen);
  const [areOptionsOpen, setAreOptionsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { orientation, flip } = useBoardOrientation('w');
  const menuActions: ActionSheetAction[] = [
    {
      label: 'Starting position',
      onPress: editor.startPosition,
      immediate: true,
      testID: 'editor-start-position',
    },
    {
      label: 'Clear board',
      onPress: editor.clear,
      immediate: true,
      testID: 'editor-clear',
    },
    ...(onCancel
      ? [
          {
            label: 'Cancel editing',
            onPress: onCancel,
            destructive: true,
            testID: 'set-up-cancel',
          },
        ]
      : []),
  ];
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        testID="set-up-position"
      >
        <PositionEditor
          editor={editor}
          width={width}
          orientation={orientation}
        />
      </ScrollView>
      <BottomBar>
        <View style={styles.toolbar} testID="set-up-toolbar">
          <ToolbarButton
            icon="menu"
            label="Menu"
            onPress={() => setIsMenuOpen(true)}
            testID="set-up-menu"
          />
          <ToolbarButton
            icon="rotate-3d-variant"
            label="Flip board"
            onPress={flip}
            testID="set-up-flip"
          />
          <ToolbarButton
            icon="head-cog-outline"
            label="Analyse"
            hint="Analyse this position"
            onPress={() => onAnalyse(editor.fen)}
            disabled={editor.errors.length > 0}
            testID="set-up-analyse"
          />
          <ToolbarButton
            icon="cog-outline"
            label="Settings"
            onPress={() => setAreOptionsOpen(true)}
            testID="set-up-options"
          />
        </View>
      </BottomBar>
      <ActionSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={menuActions}
      />
      <PositionSetupSheet
        visible={areOptionsOpen}
        editor={editor}
        onClose={() => setAreOptionsOpen(false)}
      />
    </View>
  );
};

export default SetUpPositionView;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  // The editor in the middle of the room above the toolbar.
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: t.spacing.lg,
  },
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
  },
}));
