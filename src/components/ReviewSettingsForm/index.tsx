import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';

import Icon from '../Icon';
import RadioRow from '../RadioRow';
import {
  REVIEW_AS_LABELS,
  REVIEW_SPEECH_RATE,
  REVIEW_STRENGTH_LABELS,
  REVIEW_STRENGTHS,
  ReviewAs,
  ReviewSettings,
} from '../../constants/review';
import { VOICE_SAMPLE } from '../../domain/review/phrases';
import { makeStyles, useTheme } from '../../theme';
import { voiceDisplayName, voiceQualityLabel } from '../../utils/voices';

interface ReviewSettingsFormProps {
  settings: ReviewSettings;
  onChange: (change: Partial<ReviewSettings>) => void;
  // The device's English voices, the most natural first; null while
  // they're asked for.
  voices: Speech.Voice[] | null;
}

type Toggle = 'voice' | 'showBestMoves' | 'evalBar';

const REVIEW_AS_OPTIONS = (Object.keys(REVIEW_AS_LABELS) as ReviewAs[]).map(
  (key) => ({ key, label: REVIEW_AS_LABELS[key] }),
);
const STRENGTH_OPTIONS = REVIEW_STRENGTHS.map((key) => ({
  key,
  label: REVIEW_STRENGTH_LABELS[key],
}));

// A voice tried out.
function hear(voice: Speech.Voice) {
  Speech.stop().catch(() => {});
  Speech.speak(VOICE_SAMPLE, {
    voice: voice.identifier,
    language: voice.language,
    rate: REVIEW_SPEECH_RATE,
  });
}

// What the game review shows and says, and how hard its engine looks.
const ReviewSettingsForm: React.FC<ReviewSettingsFormProps> = ({
  settings,
  onChange,
  voices,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const chosenId = settings.voiceId ?? voices?.[0]?.identifier ?? null;

  const toggle = (key: Toggle, label: string, hint?: string) => (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(value) => onChange({ [key]: value })}
        trackColor={{ true: colors.accent }}
        thumbColor={colors.switchThumb}
        accessibilityLabel={label}
        testID={`review-setting-${key}`}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="review-settings"
    >
      <View style={styles.section}>
        {toggle('voice', 'Voice', 'Each comment read aloud.')}
        {settings.voice && voices && voices.length > 0 && (
          <View style={styles.voices}>
            {voices.map((voice) => {
              const selected = voice.identifier === chosenId;
              const quality = voiceQualityLabel(voice);
              return (
                <View key={voice.identifier} style={styles.voiceRow}>
                  <Pressable
                    style={styles.voiceChoice}
                    onPress={() => onChange({ voiceId: voice.identifier })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    testID={`review-voice-${voice.identifier}`}
                  >
                    <Icon
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={selected ? colors.accent : colors.textMuted}
                    />
                    <Text style={styles.voiceName}>
                      {voiceDisplayName(voice)}
                    </Text>
                    <Text style={styles.voiceDetail}>
                      {[quality, voice.language].filter(Boolean).join(' · ')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => hear(voice)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Hear ${voiceDisplayName(voice)}`}
                    testID={`review-voice-hear-${voice.identifier}`}
                  >
                    <Icon
                      name="play-circle-outline"
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        {toggle(
          'showBestMoves',
          'Show best moves',
          'The best move marked on the board at every move.',
        )}
        {toggle('evalBar', 'Evaluation bar')}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reviewing as</Text>
        <RadioRow
          options={REVIEW_AS_OPTIONS}
          selected={settings.reviewAs}
          onSelect={(reviewAs) => onChange({ reviewAs })}
          testIDPrefix="review-as-"
        />
        <Text style={styles.hint}>
          Whose moves the review stops at - yours, in a game you played.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Strength</Text>
        <RadioRow
          options={STRENGTH_OPTIONS}
          selected={settings.strength}
          onSelect={(strength) => onChange({ strength })}
          testIDPrefix="review-strength-"
        />
        <Text style={styles.hint}>
          How hard the engine looks at each position, for games not reviewed yet
          - deeper is surer, and slower.
        </Text>
      </View>
    </ScrollView>
  );
};

export default ReviewSettingsForm;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.lg,
    gap: t.spacing.sm,
  },
  section: {
    gap: t.spacing.sm,
    paddingBottom: t.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 40,
  },
  text: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  label: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.medium,
    color: t.colors.text,
  },
  hint: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  voices: {
    gap: t.spacing.xs,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 36,
  },
  voiceChoice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  voiceName: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  voiceDetail: {
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
}));
