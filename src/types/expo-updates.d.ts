declare module 'expo-updates' {
  export function checkForUpdateAsync(): Promise<{ isAvailable: boolean; [key: string]: any }>;
  export function fetchUpdateAsync(): Promise<{ isNew: boolean; [key: string]: any }>;
  export function reloadAsync(): Promise<void>;
  export const isEmergencyLaunch: boolean;
  export const isEmbeddedLaunch: boolean;
  export const updateId: string | null;
  export const channel: string | null;
  export const runtimeVersion: string | null;
}
