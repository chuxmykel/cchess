import { fireEvent, render } from "@testing-library/react-native";

import Button from ".";

describe("Button", () => {
  it("calls onPress when pressed normally", async () => {
    const onPress = jest.fn();
    const screen = await render(<Button label="Go" onPress={onPress} testID="btn" />);

    await fireEvent.press(screen.getByTestId("btn"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the icon only when one is provided", async () => {
    const withIcon = await render(<Button label="Go" icon="⚡" testID="btn" />);
    const withoutIcon = await render(<Button label="Go" testID="btn2" />);

    expect(withIcon.queryByText("⚡")).not.toBeNull();
    expect(withoutIcon.queryByText("⚡")).toBeNull();
  });

  it("blocks all presses when disabled, never calling onPress", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <Button label="Go" onPress={onPress} disabled testID="btn" />,
    );

    await fireEvent.press(screen.getByTestId("btn"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("still responds to presses when appearsDisabled is true, routing them to onDisabledPress instead of onPress", async () => {
    const onPress = jest.fn();
    const onDisabledPress = jest.fn();
    const screen = await render(
      <Button
        label="Go"
        onPress={onPress}
        appearsDisabled
        onDisabledPress={onDisabledPress}
        testID="btn"
      />,
    );

    await fireEvent.press(screen.getByTestId("btn"));

    expect(onDisabledPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not throw when appearsDisabled is pressed without an onDisabledPress handler", async () => {
    const screen = await render(<Button label="Go" appearsDisabled testID="btn" />);

    await expect(fireEvent.press(screen.getByTestId("btn"))).resolves.not.toThrow();
  });
});
