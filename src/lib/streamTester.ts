export interface StreamTestResult {
  working: boolean;
  duration?: number;
  error?: string;
}

export const testStream = (url: string, timeoutMs = 8000): Promise<StreamTestResult> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeout);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };

    audio.oncanplay = () => {
      cleanup();
      resolve({ working: true, duration: audio.duration });
    };

    audio.onerror = () => {
      cleanup();
      resolve({ working: false, error: 'فشل تحميل البث' });
    };

    timeout = setTimeout(() => {
      cleanup();
      resolve({ working: false, error: 'انتهت مهلة الاتصال' });
    }, timeoutMs);

    audio.src = url;
    audio.load();
  });
};
