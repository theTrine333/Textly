// Reexport the native module. On web, it will be resolved to ExpoSmsManagerModule.web.ts
// and on native platforms to ExpoSmsManagerModule.ts
export { default } from './src/ExpoSmsManagerModule';
export { default as ExpoSmsManagerView } from './src/ExpoSmsManagerView';
export * from  './src/ExpoSmsManager.types';
