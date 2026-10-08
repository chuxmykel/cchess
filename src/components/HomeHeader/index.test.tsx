import { fireEvent, render } from "@testing-library/react-native";

import HomeHeader from ".";
import { withSafeArea } from "../../testUtils/safeArea";

describe("HomeHeader", () => {
  it("calls onAvatarPress when the avatar is pressed", async () => {
    const onAvatarPress = jest.fn();
    const screen = await render(withSafeArea(<HomeHeader onAvatarPress={onAvatarPress} />));

    await fireEvent.press(screen.getByTestId("avatar-button"));

    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });
});
