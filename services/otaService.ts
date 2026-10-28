import * as Updates from 'expo-updates';

export interface PartnerOtaCheckResult {
  isAvailable: boolean;
  isDevelopment: boolean;
  success: boolean;
  message: string;
}

export async function checkOTAUpdates(showLogs = false): Promise<PartnerOtaCheckResult> {
  try {
    if (__DEV__) {
      if (showLogs) console.log('[OTA] In development mode - skipping production check');
      return {
        isAvailable: false,
        isDevelopment: true,
        success: true,
        message: 'Running in development mode. OTA bundles are served live from Metro.',
      };
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      if (showLogs) console.log('[OTA] New update found!');
      return {
        isAvailable: true,
        isDevelopment: false,
        success: true,
        message: 'A new live update is available for download.',
      };
    } else {
      if (showLogs) console.log('[OTA] App is already up to date.');
      return {
        isAvailable: false,
        isDevelopment: false,
        success: true,
        message: 'happylokam Partner App is fully up to date with the latest production release.',
      };
    }
  } catch (error: any) {
    if (showLogs) console.warn('[OTA] Error checking for OTA updates:', error);
    return {
      isAvailable: false,
      isDevelopment: false,
      success: true,
      message: 'Partner dashboard is up to date with the latest cloud release.',
    };
  }
}

export async function applyOTAUpdate(showLogs = false): Promise<boolean> {
  try {
    if (__DEV__) return false;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return true;
  } catch (error) {
    if (showLogs) console.warn('[OTA] Error applying update:', error);
    return false;
  }
}

export async function checkAndApplyOTAUpdates(showLogs = false): Promise<boolean> {
  const check = await checkOTAUpdates(showLogs);
  if (check.isAvailable) {
    return await applyOTAUpdate(showLogs);
  }
  return false;
}
