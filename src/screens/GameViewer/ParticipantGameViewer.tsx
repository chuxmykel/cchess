import { useState } from 'react';
import { Color } from 'chess.js';

import { useGameChat } from '../../hooks/useGameChat';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chat = useGameChat(socket, props.snapshot.id, myUserId, isChatOpen);

  return (
    <GameViewerContent
      {...props}
      chat={{
        ...chat,
        myUserId,
        isOpen: isChatOpen,
        isClosed: hasChatClosed(props.snapshot.chatClosesAt),
        open: () => setIsChatOpen(true),
        close: () => setIsChatOpen(false),
      }}
    />
  );
};

export default ParticipantGameViewer;
