import * as Updates from 'expo-updates';

export async function checkAndApplyOTAUpdates(showLogs = false): Promise<boolean> {
  try {
    if (__DEV__) {
      if (showLogs) console.log('[OTA] In development mode - skipping OTA check');
      return false;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      if (showLogs) console.log('[OTA] New update found! Downloading...');
      await Updates.fetchUpdateAsync();
      if (showLogs) console.log('[OTA] Update downloaded. Reloading app...');
      await Updates.reloadAsync();
      return true;
    } else {
      if (showLogs) console.log('[OTA] App is already up to date.');
      return false;
    }
  } catch (error) {
    if (showLogs) console.warn('[OTA] Error checking for OTA updates:', error);
    return false;
  }
}
