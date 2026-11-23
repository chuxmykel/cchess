import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

import { getAppConfig } from '../network/restClient';
import { isOlderVersion } from '../utils/appVersion';

/** This app's version, as app.json gives it. */
export function appVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/** Whether the server says this app is too old to work with it - asked
 * once on launch; unreachable, the app carries on as it would. */
export function useUpdateRequired(): boolean {
  const [isRequired, setIsRequired] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    getAppConfig()
      .then((config) => {
        if (isCurrent) {
          setIsRequired(isOlderVersion(appVersion(), config.minimumVersion));
        }
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, []);
  return isRequired;
}
