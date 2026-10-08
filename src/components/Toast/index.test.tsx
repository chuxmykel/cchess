import { render } from '@testing-library/react-native';

import Toast from '.';
import { ToastItem } from '../../hooks/useToast';
import { withSafeArea } from '../../testUtils/safeArea';

describe('Toast', () => {
  it('renders nothing when there are no toasts', async () => {
    const screen = await render(withSafeArea(<Toast toasts={[]} />));

    expect(screen.queryAllByText(/.+/)).toHaveLength(0);
  });

  it("renders each toast's message", async () => {
    const toasts: ToastItem[] = [
      { id: 1, message: 'First' },
      { id: 2, message: 'Second' },
    ];
    const screen = await render(withSafeArea(<Toast toasts={toasts} />));

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it("renders toasts oldest-first, matching the order they're given in", async () => {
    const toasts: ToastItem[] = [
      { id: 1, message: 'First' },
      { id: 2, message: 'Second' },
      { id: 3, message: 'Third' },
    ];
    const screen = await render(withSafeArea(<Toast toasts={toasts} />));

    const texts = screen
      .getAllByText(/^(First|Second|Third)$/)
      .map((node) => node.props.children);

    expect(texts).toEqual(['First', 'Second', 'Third']);
  });
});
