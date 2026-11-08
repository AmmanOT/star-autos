/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __bootMark?: (percent: number) => void;
  __finishBoot?: () => void;
}

