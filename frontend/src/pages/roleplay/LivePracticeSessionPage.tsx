import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatching } from '../../contexts/MatchingContext';
import { useAuth } from '../../contexts/AuthContext';
import PracticeSession from '../../components/PracticeSession';

const LivePracticeSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { activeSession, endSession, sessionUserId } = useMatching();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (activeSession && activeSession.id === sessionId) {
      setSession(activeSession);
    } else {
      // If no active session, redirect back to matching
      navigate('/matching');
    }
  }, [activeSession, sessionId, navigate]);

  const handleEndSession = async (sessionId: string, feedback?: any) => {
    await endSession(sessionId, feedback);
    navigate('/matching');
  };

  const handleClose = () => {
    navigate('/matching');
  };

  if (!session || !user) {
    return null;
  }

  return (
    <PracticeSession
      session={session}
      currentUserId={sessionUserId}
      currentUserName={`${user.firstName} ${user.lastName}`}
      onEndSession={handleEndSession}
      onClose={handleClose}
    />
  );
};

export default LivePracticeSessionPage;
