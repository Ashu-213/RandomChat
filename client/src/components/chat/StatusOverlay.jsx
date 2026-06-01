import { memo } from 'react';
import useChatStore from '../../store/chatStore';

const StatusOverlay = memo(function StatusOverlay() {
  const chatState       = useChatStore((s) => s.chatState);
  const isSocketConnected = useChatStore((s) => s.isSocketConnected);
  const error           = useChatStore((s) => s.error);

  return (
    <div className="status-area">
      <div className="status-dot-wrap">
        <div className={`status-dot ${isSocketConnected ? 'online' : 'offline'}`} />
        <span className="status-label">{isSocketConnected ? 'Live' : 'Offline'}</span>
      </div>

      {chatState && chatState !== 'idle' && (
        <div className={`state-badge ${getBadgeClass(chatState)}`}>
          {getLabel(chatState)}
        </div>
      )}

      {error && (
        <div className="error-badge" title={error}>⚠ {error}</div>
      )}
    </div>
  );
});

function getLabel(state) {
  switch (state) {
    case 'requesting_media': return 'Setting up';
    case 'searching':        return 'Searching';
    case 'connecting':       return 'Connecting';
    case 'connected':        return 'Live';
    case 'permission_denied': return 'Blocked';
    default: return state;
  }
}

function getBadgeClass(state) {
  switch (state) {
    case 'connected':        return 'connected';
    case 'searching':        return 'searching';
    case 'connecting':       return 'connecting';
    case 'permission_denied': return 'blocked';
    default: return '';
  }
}

export default StatusOverlay;
