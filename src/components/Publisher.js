import { useEffect, useRef, useState } from 'react';
import OT from '@opentok/client';
import {
  FaVideo,
  FaVideoSlash,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const Publisher = ({ session, onSessionEnd }) => {
  const publisherRef = useRef(null);
  const publisherObj = useRef(null);
  const recognitionRef = useRef(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [caption, setCaption] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!session) return;

    const publisher = OT.initPublisher(publisherRef.current, {
      insertMode: 'append',
      width: '100%',
      height: '100%',
    });

    session.publish(publisher, (err) => {
      if (err) console.error('Publisher error:', err);
    });

    publisherObj.current = publisher;

    session.on('signal:caption', (event) => {
      setCaption(event.data);
      setTimeout(() => setCaption(''), 5000);
    });

    session.on('signal:chat', (event) => {
      const isSelf = event.from.connectionId === session.connection.connectionId;
      setMessages((prev) => [
        ...prev,
        { text: event.data, sender: isSelf ? 'Me' : 'Other' },
      ]);
    });

    return () => {
      session.off('signal:caption');
      session.off('signal:chat');
      publisher.destroy();
      stopRecognition();
    };
  }, [session]);

  const toggleCaptions = () => {
    const newState = !captionsEnabled;
    setCaptionsEnabled(newState);
    if (publisherObj.current?.publishCaptions) {
      publisherObj.current.publishCaptions(newState);
    }

    if (newState) {
      startRecognition();
    } else {
      stopRecognition();
    }
  };

  const startRecognition = () => {
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      setCaption(transcript);

      if (session) {
        session.signal({ type: 'caption', data: transcript });
      }

      setTimeout(() => setCaption(''), 5000);
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const toggleAudio = () => {
    if (publisherObj.current) {
      const newAudioState = !audioEnabled;
      publisherObj.current.publishAudio(newAudioState);
      setAudioEnabled(newAudioState);
    }
  };

  const toggleVideo = () => {
    if (publisherObj.current) {
      const newVideoState = !videoEnabled;
      publisherObj.current.publishVideo(newVideoState);
      setVideoEnabled(newVideoState);
    }
  };

  const endSession = () => {
    if (session) {
      session.disconnect();
      if (onSessionEnd) onSessionEnd();
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    session.signal({ type: 'chat', data: input.trim() }, (err) => {
      if (!err) {
        setMessages((prev) => [...prev, { text: input, sender: 'Me' }]);
        setInput('');
      }
    });
  };

  return (
    <div >
      <div className="publisher" ref={publisherRef}  />

      {/* Captions */}
      {caption && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            maxWidth: '90%',
            textAlign: 'center',
            zIndex: 1000,
          }}
        >
          {caption}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '10px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={toggleAudio}
          style={{
            backgroundColor: audioEnabled ? 'lightgreen' : 'lightcoral',
            width: '50px',
            height: '50px',
          }}
        >
          {audioEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
        <button
          onClick={toggleVideo}
          style={{
            backgroundColor: videoEnabled ? 'lightgreen' : 'lightcoral',
            width: '50px',
            height: '50px',
          }}
        >
          {videoEnabled ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={endSession}
          style={{
            backgroundColor: 'red',
            color: 'white',
            width: '100px',
            height: '50px',
            fontWeight: 'bold',
          }}
        >
          End Call
        </button>
        <button onClick={toggleCaptions} style={{ backgroundColor: captionsEnabled ? 'whitesmoke' : 'lightgray' }}>
          {captionsEnabled ? 'CC On' : 'CC Off'}
        </button>
      </div>

      {/* Chat */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 80,
          width: '300px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
        }}
      >
        <h4>Chat</h4>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        <div style={{ display: 'flex', marginTop: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message"
            style={{ flex: 1 }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Publisher;
