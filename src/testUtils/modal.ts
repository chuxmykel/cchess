import { act } from '@testing-library/react-native';

const BOTTOM_SHEET_CLOSE_WAIT_MS = 300;

export async function waitForSheetToClose(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, BOTTOM_SHEET_CLOSE_WAIT_MS),
    );
  });
}
