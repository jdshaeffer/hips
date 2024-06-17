import { useEffect, useRef, useState } from 'react';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import Player from './Player';
import { Socket, io } from 'socket.io-client';
import './App.css';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

function App() {
  const borderRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [playerIndex, setPlayerIndex] = useState<number>();
  const [playerId, setPlayerId] = useState<string>('');

  useEffect(() => {
    socket =
      process.env.NODE_ENV === 'production'
        ? io('https://nycmud.com', {
            path: '/socket.io',
          })
        : io('http://localhost:3001');
    socket.on('playerConnect', (clientIds) => {
      setClients(clientIds);
    });
    socket.on('playerDisconnect', (clientIds) => {
      setClients(clientIds);
    });
    socket.on('playerAssignment', (playerId: string) => {
      setPlayerId(playerId);
    });
  }, []);

  useEffect(() => {
    console.log({ playerId });
  }, [playerId]);

  useEffect(() => {
    const i = clients.indexOf(playerId);
    setPlayerIndex(i + 1);
  }, [clients]);

  return (
    <>
      <div ref={borderRef} className='center-box'>
        <Player
          borderRef={borderRef}
          socket={socket}
          isRemote={false}
          clientId=''
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
        }}
      >
        <h2>🚧 under construction 🚧</h2>
        <p>use arrow/wasd to move, space to "punch"</p>
        <p>
          you are client <span style={{ fontWeight: 'bold' }}>{playerId}</span>,
          you are player {playerIndex}
        </p>
      </div>
      <div
        style={{ bottom: 0, position: 'fixed', color: 'white', margin: '1vh' }}
      >
        Connected clients:
        <ul>
          {clients.map((id) => (
            <li>{id}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
