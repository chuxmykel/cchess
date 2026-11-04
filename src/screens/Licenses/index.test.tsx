import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

import Licenses from '.';
import { ENGINE_SOURCE_URL } from '../../constants/engine';

describe('Licenses', () => {
  it("names the engine's licence, and links to its source", async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(<Licenses />);

    expect(screen.getByText(/GNU General Public License/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('license-engine-source'));

    expect(openURL).toHaveBeenCalledWith(ENGINE_SOURCE_URL);
  });
});
