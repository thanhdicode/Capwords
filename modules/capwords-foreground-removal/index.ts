// Re-export the native module. On web, it will be resolved to CapWordsForegroundRemovalModule.web.ts
// and on native platforms to CapWordsForegroundRemovalModule.ts
export { default } from './src/CapWordsForegroundRemovalModule';
export * from './src/CapWordsForegroundRemoval.types';
