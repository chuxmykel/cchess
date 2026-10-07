import { useState } from "react";
import { View } from "react-native";

import BottomSheet from "../BottomSheet";
import TimeControlTrigger, {
  TriggerStyleVariant,
  TRIGGER_STYLE_VARIANTS,
} from "./TimeControlTrigger";
import TimeControlOptions from "./TimeControlOptions";
import { TimeControl } from "../../constants/timeControls";

export type { TriggerStyleVariant };
export { TRIGGER_STYLE_VARIANTS };

interface TimeControlSelectorProps {
  selected: TimeControl;
  onSelect: (timeControl: TimeControl) => void;
  triggerStyleVariant?: TriggerStyleVariant;
  showTypeName?: boolean;
}

const TimeControlSelector: React.FC<TimeControlSelectorProps> = ({
  selected,
  onSelect,
  triggerStyleVariant,
  showTypeName,
}) => {
  const [visible, setVisible] = useState(false);

  function handleSelect(timeControl: TimeControl) {
    onSelect(timeControl);
    setVisible(false);
  }

  return (
    <View>
      <TimeControlTrigger
        selected={selected}
        visible={visible}
        onPress={() => setVisible(true)}
        triggerStyleVariant={triggerStyleVariant}
        showTypeName={showTypeName}
      />

      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <TimeControlOptions selected={selected} onSelect={handleSelect} />
      </BottomSheet>
    </View>
  );
};

export default TimeControlSelector;
