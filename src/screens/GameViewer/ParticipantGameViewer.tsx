import { Color } from 'chess.js';

import { useGameChatSheet } from '../../hooks/useGameChat';
import { AppSocket } from '../../network/socketClient';
import GameViewerContent from './GameViewerContent';

type ParticipantGameViewerProps = Omit<
  React.ComponentProps<typeof GameViewerContent>,
  'chat' | 'myColor'
> & {
  socket: AppSocket;
  myUserId: string;
  myColor: Color;
};

function hasChatClosed(chatClosesAt: string | null): boolean {
  return chatClosesAt !== null && Date.parse(chatClosesAt) <= Date.now();
}

// The viewer for one of your own games, which comes with its chat.
const ParticipantGameViewer: React.FC<ParticipantGameViewerProps> = ({
  socket,
  myUserId,
  ...props
}) => {
  const chat = useGameChatSheet(
    socket,
    props.snapshot.id,
    myUserId,
    hasChatClosed(props.snapshot.chatClosesAt),
  );

  return <GameViewerContent {...props} chat={chat} />;
};

export default ParticipantGameViewer;
