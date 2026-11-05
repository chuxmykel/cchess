import AppearanceSettingsForm from '../../components/AppearanceSettingsForm';
import { useAppearance } from '../../theme';

// Light or dark mode and the board's colors: each change is saved as it's
// made, and shows at once.
const Appearance: React.FC = () => {
  const { settings, update } = useAppearance();
  return <AppearanceSettingsForm settings={settings} onChange={update} />;
};

export default Appearance;
