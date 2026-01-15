const progressHistory: { timestamp: number; progress: number }[] = [];

export default function onProgress(progress: number) {
  // ----- Time estimation -----
  // We use a simple sliding average over the last few data points and assume
  // that speed for the rest of the upload.
  const now = Date.now();

  // Add progress data point to history.
  progressHistory.push({
    timestamp: now,
    progress,
  });

  // The size of the sliding window in milliseconds.
  const WINDOW_SIZE_MS = 5000;
  // The size of the sliding window in number of data points.
  const WINDOW_SIZE_DATA_POINTS = 6;
  // The number of datapoints below which we won't show a time estimate.
  const MINIMUM_DATA_POINT_COUNT = 4;

  // Find the first element within the window. We use the larger window of the
  // two windows created by the two constraints (time and number of
  // datapoints).
  const windowStart = Math.min(
    progressHistory.findIndex((p) => now - p.timestamp < WINDOW_SIZE_MS),
    Math.max(0, progressHistory.length - WINDOW_SIZE_DATA_POINTS),
  );

  // Remove all elements outside the window.
  progressHistory.splice(0, windowStart);

  let secondsLeft = null;
  if (progressHistory.length >= MINIMUM_DATA_POINT_COUNT) {
    // Calculate the remaining time based on the average speed within the window.
    const windowLength = now - (progressHistory[0]?.timestamp || 0);
    const progressInWindow = progress - (progressHistory[0]?.progress || 0);
    const progressPerSecond = (progressInWindow / windowLength) * 1000;
    const progressLeft = 1 - progress;
    secondsLeft = Math.max(0, Math.round(progressLeft / progressPerSecond));
  }

  // Note: This function is called from upload progress callbacks, not from React components
  // Interval logic should be managed by the component that uses this function
  // Removed useEffect as it violates React Hooks rules (hooks can only be called in components/hooks)
  return { secondsLeft, currentProgress: progress };
}
