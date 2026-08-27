import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { testId } from "@watchdog/test-kit";

type Listener = (event: Event) => void;

class EventSourceMock {
  static instances: EventSourceMock[] = [];
  url: string;
  listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    EventSourceMock.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  close() {}

  emit(type: string, data: string) {
    const event = new MessageEvent(type, { data });
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

vi.stubGlobal("EventSource", EventSourceMock);

import { useLiveEvents } from "@/shared/hooks/use-live-events";

describe("useLiveEvents", () => {
  it("does not connect when caseId is null", () => {
    EventSourceMock.instances = [];
    renderHook(() => {
      useLiveEvents(null, vi.fn());
    });
    expect(EventSourceMock.instances).toHaveLength(0);
  });

  it("subscribes to watchdog event types for the active case", () => {
    EventSourceMock.instances = [];
    const onEvent = vi.fn();
    const caseId = testId(10);

    renderHook(() => {
      useLiveEvents(caseId, onEvent);
    });

    const source = EventSourceMock.instances[0];
    expect(source?.url).toBe(
      `/api/events?caseId=${encodeURIComponent(caseId)}`
    );

    source?.emit(
      "job_update",
      JSON.stringify({ caseId, jobId: testId(11), status: "queued" })
    );
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ caseId, type: "job_update", status: "queued" })
    );
  });
});
