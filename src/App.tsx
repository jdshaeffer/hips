import { useEffect, useRef, useState } from 'react';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import Player from './Player';
import './App.css';
import { Socket, io } from 'socket.io-client';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

function App() {
  const borderRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [num, setNum] = useState(0);
  console.log('clients!!!', clients);

  const addClient = (clientId: string) => {
    if (!clients.includes(clientId)) {
      console.log('playerConnect', clientId, clients, num);
      console.log(clients.concat([clientId]));
      setClients(clients.concat([clientId]));
      setNum(num + 1);
    }
  };

  const removeClient = (clientId: string) => {
    if (clients.includes(clientId)) {
      console.log('playerDisconnect', clientId);
      setClients(clients.filter((id) => id !== clientId));
      setNum(num - 1);
    }
  };

  useEffect(() => {
    socket =
      process.env.NODE_ENV === 'production'
        ? io('https://nycmud.com', {
            path: '/socket.io',
          })
        : io('http://localhost:3001');
    socket.on('playerConnect', (id) => addClient(id));
    socket.on('playerDisconnect', (id) => removeClient(id));
  }, []);

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
        Connected clients: {clients.map((id: any) => `${id},`)}
      </div>
    </>
  );
}

export default App;
