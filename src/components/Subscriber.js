import { useEffect, useRef, useState } from 'react';

const Subscriber = ({ session }) => {
  const subscriberRef = useRef(null);
  const subscriberObj = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!session) return;

    const handleStreamCreated = (event) => {
      const subscriber = session.subscribe(
        event.stream,
        subscriberRef.current,
        {
          insertMode: 'append',
          width: '100%',
          height: '100%',
        },
        (err) => {
          if (err) console.error('Subscriber error:', err);
        }
      );
      subscriberObj.current = subscriber;
    };

    session.on('streamCreated', handleStreamCreated);
    session.on('signal:chat', (event) => {
      const isSelf = event.from.connectionId === session.connection.connectionId;
      const sender = isSelf ? 'Me' : 'Other';
      setMessages((prev) => [...prev, { sender, text: event.data }]);
    });

    session.on('streamDestroyed', (event) => {
      const containerId = `subscriber-${event.stream.streamId}`;
      const container = document.getElementById(containerId);
      if (container) container.remove();
    });

    return () => {
      session.off('streamCreated', handleStreamCreated);
      session.off('signal:chat');
    };
  }, [session]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="subscriber" ref={subscriberRef} style={{ width: '100%', height: '100%' }} />

      <div
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          width: '300px',
          backgroundColor: '#f1f1f1',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        <h4>Chat</h4>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriber;
