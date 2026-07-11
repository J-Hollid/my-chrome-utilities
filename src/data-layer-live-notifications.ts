export interface LiveNotificationController {
  announce: (message: string) => void;
}

export function createLiveNotificationController(
  render: (message: string) => void,
  schedule: (clear: () => void, delayMs: number) => void,
  durationMs = 4000,
): LiveNotificationController {
  let revision = 0;

  return {
    announce(message: string): void {
      revision += 1;
      const currentRevision = revision;
      render(message);
      schedule(() => {
        if (revision === currentRevision) render("");
      }, durationMs);
    },
  };
}
