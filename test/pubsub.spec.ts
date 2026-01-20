import { describe, expect, it, mock } from "bun:test";
import PubSub from "../src/pubsub";

describe("PubSub", () => {
  describe("subscribe()", () => {
    it("should register a callback for a subscription", () => {
      const pubsub = new PubSub();
      const callback = mock(() => {});

      pubsub.subscribe("testEvent", callback, { $id: "test-1" });

      // Verify by publishing
      pubsub.publish("testEvent", "other-id", "data");
      expect(callback).toHaveBeenCalledWith("data");
    });

    it("should allow multiple subscribers to the same event", () => {
      const pubsub = new PubSub();
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      pubsub.subscribe("testEvent", callback1, { $id: "comp-1" });
      pubsub.subscribe("testEvent", callback2, { $id: "comp-2" });

      pubsub.publish("testEvent", "origin", "data");

      expect(callback1).toHaveBeenCalledWith("data");
      expect(callback2).toHaveBeenCalledWith("data");
    });
  });

  describe("publish()", () => {
    it("should call all subscribers except the origin", () => {
      const pubsub = new PubSub();
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});
      const context1 = { $id: "comp-1" };
      const context2 = { $id: "comp-2" };

      pubsub.subscribe("testEvent", callback1, context1);
      pubsub.subscribe("testEvent", callback2, context2);

      // Publish from comp-1
      pubsub.publish("testEvent", "comp-1", "arg1", "arg2");

      // callback1 should NOT be called (origin)
      expect(callback1).not.toHaveBeenCalled();
      // callback2 should be called
      expect(callback2).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should return false for non-existent subscriptions", () => {
      const pubsub = new PubSub();

      const result = pubsub.publish("nonExistent", "id", "data");

      expect(result).toBe(false);
    });

    it("should return true when successfully published", () => {
      const pubsub = new PubSub();
      pubsub.subscribe("testEvent", () => {}, { $id: "test" });

      const result = pubsub.publish("testEvent", "other-id", "data");

      expect(result).toBe(true);
    });

    it("should apply callback with subscriber context", () => {
      const pubsub = new PubSub();
      let capturedThis: unknown;
      const context = { $id: "test-context", name: "TestComponent" };

      pubsub.subscribe(
        "testEvent",
        function captureContext(this: unknown) {
          capturedThis = this;
        },
        context,
      );

      pubsub.publish("testEvent", "origin", "data");

      expect(capturedThis).toBe(context);
    });
  });

  describe("unsubscribe()", () => {
    it("should warn for non-existent subscriptions", () => {
      const pubsub = new PubSub();
      const originalWarn = console.warn;
      const mockWarn = mock(() => {});
      console.warn = mockWarn;

      const result = pubsub.unsubscribe("nonExistent");

      expect(result).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
      console.warn = originalWarn;
    });

    it("should remove subscription by callback", () => {
      const pubsub = new PubSub();
      const callback = mock(() => {});
      const context = { $id: "test" };

      pubsub.subscribe("testEvent", callback, context);
      pubsub.unsubscribe("testEvent", callback);
      pubsub.publish("testEvent", "origin", "data");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should remove subscription by context", () => {
      const pubsub = new PubSub();
      const callback = mock(() => {});
      const context = { $id: "test" };

      pubsub.subscribe("testEvent", callback, context);
      pubsub.unsubscribe("testEvent", undefined, context);
      pubsub.publish("testEvent", "origin", "data");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should remove subscription by callback and context", () => {
      const pubsub = new PubSub();
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});
      const context = { $id: "test" };

      pubsub.subscribe("testEvent", callback1, context);
      pubsub.subscribe("testEvent", callback2, context);
      pubsub.unsubscribe("testEvent", callback1, context);
      pubsub.publish("testEvent", "origin", "data");

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith("data");
    });

    it("should remove all subscriptions when no filter specified", () => {
      const pubsub = new PubSub();
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      pubsub.subscribe("testEvent", callback1, { $id: "comp-1" });
      pubsub.subscribe("testEvent", callback2, { $id: "comp-2" });
      pubsub.unsubscribe("testEvent");
      pubsub.publish("testEvent", "origin", "data");

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
