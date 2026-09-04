export interface SchemaLifecycle {
  mount(): boolean;
  listen<EventType extends Event>(
    target: EventTarget | null | undefined,
    type: string,
    listener: (event: EventType) => void,
    options?: AddEventListenerOptions | boolean,
  ): void;
  own(dispose: () => void): void;
  dispose(): boolean;
  isMounted(): boolean;
  generation(): number;
  isCurrent(generation: number): boolean;
}

/** Owns one installed Schema controller listener generation. */
export function createSchemaLifecycle(): SchemaLifecycle {
  let mounted = false;
  let generation = 0;
  let disposers: Array<() => void> = [];

  return {
    mount(): boolean {
      if (mounted) return false;
      mounted = true;
      generation += 1;
      return true;
    },
    listen<EventType extends Event>(target: EventTarget | null | undefined, type: string,
      listener: (event: EventType) => void, options?:AddEventListenerOptions | boolean): void {
      if (!mounted || !target) return;
      const eventListener = listener as EventListener;
      target.addEventListener(type, eventListener, options);
      disposers.push(() => target.removeEventListener(type, eventListener, options));
    },
    own(dispose): void {
      if (!mounted) {
        dispose();
        return;
      }
      disposers.push(dispose);
    },
    dispose(): boolean {
      if (!mounted) return false;
      mounted = false;
      generation += 1;
      for (const dispose of disposers.splice(0).reverse()) dispose();
      return true;
    },
    isMounted: () => mounted,
    generation: () => generation,
    isCurrent: (candidate) => mounted && candidate === generation,
  };
}
