import { useEffect, useRef, useState } from 'react';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import Player from './components/Player';
import RemotePlayer from './components/RemotePlayer';
import { Socket, io } from 'socket.io-client';
import './styles/App.css';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

function App() {
  const borderRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [socketError, setSocketError] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(true);

  const onSocketConnect = () => {
    if (socketError || !connected) {
      console.log('Socket reconnected!');
      socket.emit('requestCacheDump');
    }

    setSocketError(false);
    setConnected(true);
  };

  const onSocketError = (err: any) => {
    console.error('Error occured with socket.io', err);
    setSocketError(true);
  };

  const onSocketDisconnect = () => {
    setConnected(false);
  };

  useEffect(() => {
    socket =
      process.env.NODE_ENV === 'production'
        ? io('https://nycmud.com', {
            path: '/socket.io',
          })
        : io('http://localhost:3001');

    // status
    socket.on('connect_error', onSocketError);
    socket.on('reconnect_error', onSocketError);
    socket.on('reconnect_failure', onSocketError);
    socket.on('error', onSocketError);

    socket.on('connect', onSocketConnect);
    socket.on('reconnect', onSocketConnect);
    socket.on('disconnect', onSocketDisconnect);

    // data updating
    socket.on('clientUpdate', (clientIds: string[]) => {
      setClients(clientIds);
      socket.emit('requestCacheDump');
    });
  }, []);

  return (
    <>
      <div ref={borderRef} className='center-box'>
        <Player socket={socket} borderRef={borderRef} />
        {clients
          ?.filter((id) => socket !== undefined && id !== socket.id)
          .map((id: string) => {
            return <RemotePlayer key={id} socket={socket} clientId={id} />;
          })}
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
        Connected clients:{' '}
        {clients?.map((id: any) => {
          if (socket === undefined || id !== socket.id) return id + ', ';
          // is this local client id
          else
            return (
              <i key={id} className='local-client-id'>
                {id} (self),{' '}
              </i>
            );
        })}
      </div>
      <div className='network-status'>
        {connected ? '' : socketError ? '🟥' : '🟧'}
      </div>
    </>
  );
}

export default App;
