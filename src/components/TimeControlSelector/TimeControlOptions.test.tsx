import { fireEvent, render } from "@testing-library/react-native";

import TimeControlOptions from "./TimeControlOptions";
import { DEFAULT_TIME_CONTROL, TimeControl } from "../../constants/timeControls";

const OPTION_TEST_ID_PREFIX = "time-control-option-";

// The full, fixed set of options every group must render - hardcoded
// (rather than derived from TIME_CONTROL_GROUPS) so a regression that drops
// an entry from that constant fails this test too, not just a bug in how
// TimeControlOptions renders it.
const ALL_OPTION_TEST_IDS = [
  "bullet-0+1",
  "bullet-1+0",
  "bullet-1+1",
  "bullet-2+1",
  "blitz-3+0",
  "blitz-3+2",
  "blitz-5+0",
  "blitz-5+3",
  "rapid-10+0",
  "rapid-10+5",
  "rapid-15+0",
  "rapid-15+10",
  "classical-25+0",
  "classical-30+0",
  "classical-30+20",
  "classical-60+0",
].map((suffix) => `${OPTION_TEST_ID_PREFIX}${suffix}`);

describe("TimeControlOptions", () => {
  it("renders all 16 time control options, since the set is fixed and a missing one is a regression", async () => {
    const screen = await render(
      <TimeControlOptions selected={DEFAULT_TIME_CONTROL} onSelect={jest.fn()} />,
    );

    const renderedTestIds = screen
      .getAllByTestId(new RegExp(`^${OPTION_TEST_ID_PREFIX}`))
      .map((option) => option.props.testID);

    expect(renderedTestIds.sort()).toEqual([...ALL_OPTION_TEST_IDS].sort());
  });

  it("calls onSelect with the pressed option", async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <TimeControlOptions selected={DEFAULT_TIME_CONTROL} onSelect={onSelect} />,
    );

    await fireEvent.press(screen.getByTestId(`${OPTION_TEST_ID_PREFIX}rapid-10+5`));

    expect(onSelect).toHaveBeenCalledWith<[TimeControl]>({ type: "rapid", label: "10+5" });
  });

  it("does not call onSelect for an option that wasn't pressed", async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <TimeControlOptions selected={DEFAULT_TIME_CONTROL} onSelect={onSelect} />,
    );

    await fireEvent.press(screen.getByTestId(`${OPTION_TEST_ID_PREFIX}bullet-0+1`));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalledWith(DEFAULT_TIME_CONTROL);
  });
});
