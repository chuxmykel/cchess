export interface Friend {
  id: string;
  name: string;
  lastActive: string;
}

// FIXME: Placeholder data until friends are backed by a real API.
export const FRIENDS: Friend[] = [
  { id: '1', name: 'Ada Lovelace', lastActive: 'Active now' },
  { id: '2', name: 'Garry Kasparov', lastActive: 'Active 5m ago' },
  { id: '3', name: 'Judit Polgar', lastActive: 'Active 1h ago' },
  { id: '4', name: 'Magnus Carlsen', lastActive: 'Active 3h ago' },
  { id: '5', name: 'Hou Yifan', lastActive: 'Active yesterday' },
];
