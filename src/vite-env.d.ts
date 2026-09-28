/// <reference types="vite/client" />

interface Window {
  __bootMark?: (percent: number) => void;
  __finishBoot?: () => void;
}

