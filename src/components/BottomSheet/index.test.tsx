import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import BottomSheet from ".";
import { withSafeArea } from "../../testUtils/safeArea";

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
