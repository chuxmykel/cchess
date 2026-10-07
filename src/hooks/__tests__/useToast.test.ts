import { act, renderHook } from "@testing-library/react-native";

import { useToast } from "../useToast";

describe("useToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with no toasts", async () => {
    const { result } = await renderHook(() => useToast());

    expect(result.current.toasts).toEqual([]);
  });

  it("show adds a toast", async () => {
    const { result } = await renderHook(() => useToast());

    await act(() => {
      result.current.show("Coming soon");
    });

    expect(result.current.toasts.map((toast) => toast.message)).toEqual(["Coming soon"]);
  });

  it("stacks multiple toasts oldest first", async () => {
    const { result } = await renderHook(() => useToast());

    await act(() => {
      result.current.show("First");
      result.current.show("Second");
    });

    expect(result.current.toasts.map((toast) => toast.message)).toEqual(["First", "Second"]);
  });

  it("drops the oldest toast once a 4th arrives", async () => {
    const { result } = await renderHook(() => useToast());

    await act(() => {
      for (let i = 1; i <= 4; i++) {
        result.current.show(`Toast ${i}`);
      }
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts.map((toast) => toast.message)).toEqual([
      "Toast 2",
      "Toast 3",
      "Toast 4",
    ]);
  });

  it("dismisses a toast after the default duration", async () => {
    const { result } = await renderHook(() => useToast(2000));

    await act(() => {
      result.current.show("Coming soon");
    });
    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.toasts).toEqual([]);
  });

  it("honors a per-call duration override", async () => {
    const { result } = await renderHook(() => useToast(2000));

    await act(() => {
      result.current.show("Quick toast", 500);
    });
    await act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.toasts).toEqual([]);
  });

  it("dismisses toasts independently of each other", async () => {
    const { result } = await renderHook(() => useToast(2000));

    await act(() => {
      result.current.show("Slow", 2000);
    });
    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    await act(() => {
      result.current.show("Fast", 500);
    });
    await act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.toasts.map((toast) => toast.message)).toEqual(["Slow"]);

    await act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.toasts).toEqual([]);
  });
});
