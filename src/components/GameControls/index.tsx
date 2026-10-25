import { Alert, View, StyleSheet } from 'react-native';

import Button from '../Button';

interface GameControlsProps {
  canAbort: boolean;
  drawOfferedByOpponent: boolean;
  drawOfferedByMe: boolean;
  onResign: () => void;
  onAbort: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  canAbort,
  drawOfferedByOpponent,
  drawOfferedByMe,
  onResign,
  onAbort,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
}) => {
  function confirmAbort() {
    Alert.alert('Abort game?', 'Are you sure you want to abort?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Abort', style: 'destructive', onPress: onAbort },
    ]);
  }

  function confirmResign() {
    Alert.alert('Resign?', 'You will lose this game.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: onResign },
    ]);
  }

  if (drawOfferedByOpponent) {
    return (
      <View style={styles.row}>
        <Button
          label="Decline"
          variant="outline"
          onPress={onDeclineDraw}
          style={styles.button}
          testID="decline-draw-button"
        />
        <Button
          label="Accept Draw"
          variant="primary"
          onPress={onAcceptDraw}
          style={styles.button}
          testID="accept-draw-button"
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Button
        label={canAbort ? 'Abort' : 'Resign'}
        variant="outline"
        onPress={canAbort ? confirmAbort : confirmResign}
        style={styles.button}
        testID={canAbort ? 'abort-button' : 'resign-button'}
      />
      <Button
        label={drawOfferedByMe ? 'Draw Offered' : 'Offer Draw'}
        variant="outline"
        onPress={onOfferDraw}
        disabled={drawOfferedByMe}
        style={styles.button}
        testID="offer-draw-button"
      />
    </View>
  );
};

export default GameControls;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
  },
});
