/// <reference types="vite/client" />

declare global {
  interface Window {
    __SERVER_SIDE_PROPS__: any;
  }
}
