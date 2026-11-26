import { ChatMessage, GameSnapshot } from '../network/socketEvents';
import { ReportTarget } from './HomeStack/types';

/** What reporting a message in a game's chat reports: who wrote it, and the
 * message, in its game. */
export function chatReportTarget(
  snapshot: GameSnapshot,
  message: ChatMessage,
): ReportTarget {
  const author =
    snapshot.white.id === message.userId ? snapshot.white : snapshot.black;
  return {
    username: author.username,
    displayName: author.displayName,
    gameId: snapshot.id,
    messageId: message.id,
    messageText: message.text,
  };
}
