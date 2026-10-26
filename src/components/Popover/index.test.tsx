import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import Popover from '.';

const popoverCaretTestId = 'my-popover';

describe('Popover', () => {
  it('renders its children in the content box when visible', async () => {
    const screen = await render(
      <Popover
        visible={true}
        position={{ top: 10, left: 20 }}
        onClose={jest.fn()}
        testID={popoverCaretTestId}
      >
        <Text>Hello</Text>
      </Popover>,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByTestId(popoverCaretTestId)).toBeTruthy();
  });

  it('calls onClose when the overlay is tapped', async () => {
    const onClose = jest.fn();
    const screen = await render(
      <Popover
        visible={true}
        position={{ top: 0, left: 0 }}
        onClose={onClose}
        overlayTestID="my-overlay"
      >
        <Text>Hello</Text>
      </Popover>,
    );

    await fireEvent.press(screen.getByTestId('my-overlay'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render a caret when caretSide is omitted', async () => {
    const screen = await render(
      <Popover
        visible={true}
        position={{ top: 0, left: 0 }}
        onClose={jest.fn()}
        testID={popoverCaretTestId}
      >
        <Text>Hello</Text>
      </Popover>,
    );

    expect(screen.queryByTestId(`${popoverCaretTestId}-caret`)).toBeNull();
  });

  const OPPOSITE_EDGE = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  } as const;

  it.each<['top' | 'bottom' | 'left' | 'right']>([
    ['top'],
    ['bottom'],
    ['left'],
    ['right'],
  ])('renders a caret on the %s edge when requested', async (caretSide) => {
    const screen = await render(
      <Popover
        visible={true}
        position={{ top: 0, left: 0 }}
        onClose={jest.fn()}
        caretSide={caretSide}
        testID={popoverCaretTestId}
      >
        <Text>Hello</Text>
      </Popover>,
    );

    const caret = screen.getByTestId(`${popoverCaretTestId}-caret`);
    const caretStyle = caret.props.style;

    expect(caretStyle[caretSide]).toBeDefined();
    expect(caretStyle[OPPOSITE_EDGE[caretSide]]).toBeUndefined();
  });

  it("keeps the overlay out of the accessibility tree so the content's own elements stay reachable", async () => {
    const screen = await render(
      <Popover
        visible={true}
        position={{ top: 0, left: 0 }}
        onClose={jest.fn()}
        overlayTestID="my-popover-overlay"
      >
        <Text>Hello</Text>
      </Popover>,
    );

    expect(screen.getByTestId('my-popover-overlay').props.accessible).toBe(
      false,
    );
  });
});
