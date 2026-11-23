import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { analytics } from '../../analytics/analytics';
import AccountForm from '../../components/AccountForm';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import TextField from '../../components/TextField';
import { REPORT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useBlocking } from '../../hooks/useBlocking';
import {
  REPORT_REASONS,
  ReportReason,
  reportUser,
} from '../../network/restClient';
import { makeStyles, useTheme } from '../../theme';
import { HomeStackParamList } from '../HomeStack/types';

const REASON_LABELS: Record<ReportReason, string> = {
  abuse: 'Abuse or harassment',
  hate: 'Hate speech',
  sexual: 'Sexual content',
  spam: 'Spam',
  cheating: 'Cheating',
  username: 'Offensive name or profile',
  other: 'Something else',
};
const MAX_DETAILS_LENGTH = 500;

type ReportProps = NativeStackScreenProps<HomeStackParamList, 'Report'>;

/** Reporting a player - for a message, or just them - then offering to
 * block them too. */
const Report: React.FC<ReportProps> = ({ navigation, route }) => {
  const target = route.params;
  const styles = useStyles();
  const { colors } = useTheme();
  const { authorized } = useAuthSession();
  const { confirmBlock } = useBlocking();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSent, setIsSent] = useState(false);

  const submission = useAsyncAction(
    useCallback(async () => {
      if (!reason) return;
      await authorized((token) =>
        reportUser(
          {
            username: target.username,
            reason,
            details: details.trim() || undefined,
            gameId: target.gameId,
            messageId: target.messageId,
          },
          token,
        ),
      );
    }, [authorized, details, reason, target]),
    REPORT_FAILED_MESSAGE,
  );

  async function submit() {
    if (await submission.run()) {
      analytics.capture('report_sent', { reason });
      setIsSent(true);
    }
  }

  async function block() {
    if (await confirmBlock(target).catch(() => false)) navigation.goBack();
  }

  if (isSent) {
    return (
      <View style={styles.sent} testID="report-sent">
        <Icon name="check-circle-outline" size={48} color={colors.accent} />
        <Text style={styles.sentTitle}>Thanks for telling us</Text>
        <Text style={styles.text}>
          We&apos;ll look into it. You can also block {target.displayName}, so
          you&apos;re never paired and can&apos;t reach each other.
        </Text>
        <Button
          label={`Block ${target.displayName}`}
          onPress={block}
          variant="outline"
          testID="report-block-button"
        />
        <Button
          label="Done"
          onPress={navigation.goBack}
          testID="report-done-button"
        />
      </View>
    );
  }

  return (
    <AccountForm
      errorMessage={submission.errorMessage}
      submitLabel={submission.isRunning ? 'Sending…' : 'Send report'}
      canSubmit={reason !== null && !submission.isRunning}
      onSubmit={submit}
      testID="report-screen"
    >
      <Text style={styles.title}>Report {target.displayName}</Text>
      {target.messageText !== undefined && (
        <Text style={styles.quote} testID="report-message">
          &quot;{target.messageText}&quot;
        </Text>
      )}
      <View accessibilityRole="radiogroup">
        {REPORT_REASONS.map((key) => {
          const isSelected = key === reason;
          return (
            <Pressable
              key={key}
              style={styles.reason}
              onPress={() => setReason(key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              testID={`report-reason-${key}`}
            >
              <Icon
                name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={isSelected ? colors.accent : colors.textSecondary}
              />
              <Text style={styles.reasonLabel}>{REASON_LABELS[key]}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="Anything else? (optional)"
        value={details}
        onChangeText={setDetails}
        maxLength={MAX_DETAILS_LENGTH}
        multiline
        testID="report-details"
      />
    </AccountForm>
  );
};

export default Report;

const useStyles = makeStyles((t) => ({
  title: {
    ...t.typography.title,
    color: t.colors.text,
  },
  quote: {
    color: t.colors.textSecondary,
    fontSize: t.fontSize.base,
    fontStyle: 'italic',
  },
  text: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    textAlign: 'center',
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  reasonLabel: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  sent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.lg,
    padding: t.spacing.xl,
    backgroundColor: t.colors.background,
  },
  sentTitle: {
    ...t.typography.title,
    color: t.colors.text,
  },
}));
