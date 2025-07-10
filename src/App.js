import React, { useEffect, useState } from 'react';
import OT from '@opentok/client';

import "./style/video.css"
import { API_KEY, SESSION_ID, TOKEN } from './config/config';
import Publisher from './components/Publisher';
import Subscriber from './components/Subscriber';

const App = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const otSession = OT.initSession(API_KEY, SESSION_ID);

    otSession.connect(TOKEN, (err) => {
      if (err) {
        console.error('Connect error:', err.message);
      } else {
        setSession(otSession);
      }
    });

    return () => {
      otSession.disconnect();
    };
  }, []);

  return (
    <div className="video-container">
      {session && <Publisher session={session} onSessionEnd={() => alert("Call ended")} />}
      {session && <Subscriber session={session} />}
    </div>
  );
};

export default App;
