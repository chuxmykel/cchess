import { SERVER_URL } from '../network/env';

/** The pages the server serves for the stores and players: the terms of
 * use, the privacy policy, and how to delete an account without the app. */
export const TERMS_URL = `${SERVER_URL}/legal/terms`;
export const PRIVACY_URL = `${SERVER_URL}/legal/privacy`;
export const DELETE_ACCOUNT_URL = `${SERVER_URL}/account/delete`;
/** Where players reach a person - the server's SUPPORT_EMAIL. */
export const SUPPORT_EMAIL = 'support@chux.dev';
