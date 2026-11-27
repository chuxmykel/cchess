import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import type { RatingCategory } from '../../constants/ratingCategories';
import { useTheme } from '../../theme';

const DEFAULT_SIZE = 18;

// A rating category's icon: a game type's own, or a puzzle piece.
const RatingCategoryIcon: React.FC<{
  category: RatingCategory;
  size?: number;
}> = ({ category, size = DEFAULT_SIZE }) => {
  const { colors } = useTheme();
  return category === 'puzzles' ? (
    <Icon name="puzzle" size={size} color={colors.accent} />
  ) : (
    <GameTypeIcon type={category} size={size} />
  );
};

export default RatingCategoryIcon;
