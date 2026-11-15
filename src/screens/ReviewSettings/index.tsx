import ReviewSettingsForm from '../../components/ReviewSettingsForm';
import { useReviewSettingsContext } from '../../context/ReviewSettingsContext';
import { useSpeechVoices } from '../../hooks/useReviewVoice';

// The game review's settings - from Settings, or over a review: each change
// is saved as it's made.
const ReviewSettings: React.FC = () => {
  const { settings, update } = useReviewSettingsContext();
  const voices = useSpeechVoices();
  return (
    <ReviewSettingsForm settings={settings} onChange={update} voices={voices} />
  );
};

export default ReviewSettings;
