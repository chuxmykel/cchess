import { Platform, Text } from 'react-native';

import { headerRightOf } from '../../testUtils/headerRight';
import { plainHeaderRight } from '../plainHeaderOptions';

describe('plainHeaderRight', () => {
  it("puts the button in the header's right, as the platform draws it", () => {
    const button = <Text>Settings</Text>;

    const options = plainHeaderRight(button);

    expect(headerRightOf(options)).toBe(button);
    // iOS draws header items, Android only headerRight.
    if (Platform.OS === 'ios') expect(options.headerRight).toBeUndefined();
    else expect(options.unstable_headerRightItems).toBeUndefined();
  });

  it('leaves the right empty with no button', () => {
    expect(headerRightOf(plainHeaderRight(null))).toBeNull();
  });
});
