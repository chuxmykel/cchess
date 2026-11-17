import { act, RenderResult } from '@testing-library/react-native';

const BOTTOM_SHEET_CLOSE_WAIT_MS = 300;

export async function waitForSheetToClose(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, BOTTOM_SHEET_CLOSE_WAIT_MS),
    );
  });
}

/** The props a screen's (first) Modal was given - the jest preset's mock
 * renders it as a host `Modal` element keeping them. */
export function modalPropsOf(screen: RenderResult): Record<string, unknown> {
  type Node = {
    type: string;
    props: Record<string, unknown>;
    children: (Node | string)[];
  };
  const find = (node: Node | string): Node | undefined => {
    if (typeof node === 'string') return undefined;
    if (node.type === 'Modal') return node;
    for (const child of node.children) {
      const found = find(child);
      if (found) return found;
    }
    return undefined;
  };
  const modal = find(screen.root as unknown as Node);
  if (!modal) throw new Error('no Modal rendered');
  return modal.props;
}
