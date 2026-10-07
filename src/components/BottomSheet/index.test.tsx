import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import BottomSheet from ".";
import { withSafeArea } from "../../testUtils/safeArea";

// The sheet's own open/close animation, backdrop interpolation and
// drag-to-dismiss gesture are covered directly at the hook level
// (useBottomSheet.test.tsx) - these tests only cover what the component
// wires on top of that hook: rendering children, the Modal's visibility,
// and the backdrop press closing it.
describe("BottomSheet", () => {
  it("renders its children while visible", async () => {
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={jest.fn()}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );

    expect(screen.getByText("Sheet content")).toBeTruthy();
  });

  it("calls onClose when the backdrop is pressed", async () => {
    const onClose = jest.fn();
    const screen = await render(
      withSafeArea(
        <BottomSheet visible onClose={onClose}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      ),
    );

    await fireEvent.press(screen.getByTestId("bottom-sheet-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
