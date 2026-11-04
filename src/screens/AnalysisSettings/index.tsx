import AnalysisSettingsForm from '../../components/AnalysisSettingsForm';
import { useAnalysisSettingsContext } from '../../context/AnalysisSettingsContext';

// The analysis board's settings, over it: each change is saved as it's
// made, and shows on the board on the way back.
const AnalysisSettings: React.FC = () => {
  const { settings, update } = useAnalysisSettingsContext();
  return <AnalysisSettingsForm settings={settings} onChange={update} />;
};

export default AnalysisSettings;
