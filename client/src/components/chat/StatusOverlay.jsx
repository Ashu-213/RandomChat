import { memo } from 'react';
import useChatStore from '../../store/chatStore';

/**
 * StatusOverlay — Connection status indicator shown in the top bar.
 * Displays socket connection state and chat session status.
 */
const StatusOverlay = memo(function StatusOverlay() {
  const chatState = useChatStore((s) => s.chatState);
  const isSocketConnected = useChatStore((s) => s.isSocketConnected);
  const error = useChatStore((s) => s.error);

  return (
    <div className="flex items-center gap-3 px-4 py-2 relative z-10">
      
      {/* Socket connection indicator capsule */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xs py-1 px-3 rounded-full border border-slate-200/60 shadow-xs">
        <div className={`w-2 h-2 rounded-full relative ${
          isSocketConnected ? 'bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[var(--color-danger)] shadow-[0_0_8px_rgba(239,68,68,0.5)]'
        }`}>
          {isSocketConnected && (
            <span className="absolute inset-0 rounded-full bg-[var(--color-success)] opacity-75 animate-ping" />
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          {isSocketConnected ? 'System Ready' : 'Offline'}
        </span>
      </div>

      {/* Chat session state badge */}
      {chatState !== 'idle' && (
        <div className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-xs border transition-all duration-300 ${getStateBadgeClasses(chatState)}`}>
          {getStateLabel(chatState)}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="hidden md:block ml-auto text-xs text-red-500 font-bold bg-red-50 border border-red-150 px-3 py-1 rounded-full animate-fade-in truncate max-w-[200px]" title={error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
});

function getStateLabel(state) {
  switch (state) {
    case 'requesting_media': return 'Setting up...';
    case 'searching': return 'Searching';
    case 'connecting': return 'Connecting';
    case 'connected': return 'Room Active';
    case 'permission_denied': return 'Blocked';
    default: return state;
  }
}

function getStateBadgeClasses(state) {
  switch (state) {
    case 'connected': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/70 shadow-emerald-100/50';
    case 'searching': 
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/70 shadow-indigo-100/50 animate-pulse';
    case 'connecting': 
      return 'bg-amber-50 text-amber-700 border-amber-200/70 shadow-amber-100/50 animate-pulse';
    case 'permission_denied': 
      return 'bg-red-50 text-red-700 border-red-200/70 shadow-red-100/50';
    default: 
      return 'bg-slate-50 text-slate-500 border-slate-200/70';
  }
}

export default StatusOverlay;
