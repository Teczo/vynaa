import React, { useState, useEffect, useRef } from 'react';
import { NodeData } from '../types';

interface BubbleNodeProps {
  node: NodeData;
  onAsk: (question: string, parentId: string) => void;
  onDragStart: (id: string, clientX: number, clientY: number) => void;
  onHover: (id: string | null) => void;
  isRoot?: boolean;
  isLoading?: boolean;
}

// Helper functions for audio (keep these in frontend)
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  // Combine header and PCM data into a single Uint8Array
  const wavData = new Uint8Array(44 + pcmData.length);
  wavData.set(new Uint8Array(header), 0);
  wavData.set(pcmData, 44);

  return new Blob([wavData.buffer], { type: 'audio/wav' });
}

const BubbleNode: React.FC<BubbleNodeProps> = ({ node, onAsk, onDragStart, onHover, isRoot, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [localAudioData, setLocalAudioData] = useState<string | undefined>(node.audio?.base64Data);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (localAudioData) {
      const bytes = decodeBase64(localAudioData);
      const blob = pcmToWavBlob(bytes);
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;

      if (node.audio?.autoPlay) {
        audio.play().catch(e => console.warn("Autoplay blocked", e));
      }

      return () => {
        audio.pause();
        URL.revokeObjectURL(url);
      };
    }
  }, [localAudioData]);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If we don't have audio data yet, generate it on-demand via API
    if (!localAudioData && !isFetchingAudio && node.content) {
      setIsFetchingAudio(true);

      try {
        // Call backend API to generate TTS
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tts/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ text: node.content })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioBase64) {
            setLocalAudioData(data.audioBase64);
            return; // The useEffect will handle playback once state updates
          }
        }
      } catch (error) {
        console.error('Failed to generate TTS:', error);
      } finally {
        setIsFetchingAudio(false);
      }
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const replay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAsk(inputValue, node.id);
      setInputValue('');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest('button')) return;
    onDragStart(node.id, e.clientX, e.clientY);
  };

  const getStyle = () => {
    if (node.type === 'root') return 'bg-indigo-600 border-indigo-400 shadow-[0_0_50px_-10px_rgba(79,70,229,0.7)]';
    if (node.type === 'ai') return 'bg-slate-900/95 border-slate-700 shadow-2xl backdrop-blur-2xl';
    return 'bg-violet-950/95 border-violet-800 shadow-2xl backdrop-blur-2xl';
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: `translate(-50%, -50%)`,
        zIndex: node.isDragging ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="group flex flex-col items-center select-none"
    >
      <div
        className={`
          relative transition-all duration-300
          ${getStyle()}
          ${isRoot ? 'w-80 h-80 flex items-center justify-center animate-pulse-soft rounded-full' : 'max-w-md rounded-3xl p-8 border-2'}
          ${node.isDragging ? 'scale-105 cursor-grabbing' : 'cursor-grab'}
          hover:border-indigo-400
        `}
      >
        {/* Audio Interface */}
        {!isRoot && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800 border border-indigo-500/50 p-1.5 rounded-full shadow-2xl opacity-80 group-hover:opacity-100 transition-all z-50">
            <button
              onClick={togglePlay}
              disabled={isFetchingAudio}
              className={`p-2.5 rounded-full transition-all ${isPlaying ? 'bg-indigo-500 text-white' : 'bg-transparent text-indigo-300 hover:text-white'}`}
              title={isPlaying ? "Pause" : "Play Narration"}
            >
              {isFetchingAudio ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
              )}
            </button>
            {localAudioData && (
              <>
                <button
                  onClick={replay}
                  className="p-2.5 rounded-full bg-transparent text-slate-400 hover:text-white transition-all"
                  title="Replay"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-full transition-all ${isMuted ? 'text-red-400' : 'text-slate-400 hover:text-white'}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.38.27-.81.48-1.25.61v2.04c1-.22 1.94-.66 2.75-1.27L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 text-center">
          {isRoot ? (
            <div className="space-y-6 w-full px-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-white tracking-tighter">VYNAA AI</h1>
                <p className="text-indigo-200 text-sm font-medium opacity-80 uppercase tracking-widest">Interactive Audiobook</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Initiate prompt..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md transition-all text-lg"
                />
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center opacity-50">
                <span className="text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-bold">
                  {node.type === 'ai' ? 'Knowledge' : 'Curiosity'}
                </span>
                {node.audio?.durationRequested && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {node.audio.durationRequested} MIN PERSPECTIVE
                  </span>
                )}
              </div>
              <p className="text-white text-xl leading-relaxed font-light text-left whitespace-pre-wrap">
                {node.content}
              </p>
              {isLoading && (
                <div className="flex justify-start gap-1.5 py-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Logic Branches */}
      {!isRoot && !isLoading && (
        <div className="flex flex-col gap-3 mt-10 w-full max-w-sm transition-all duration-500 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex flex-wrap gap-2 justify-center">
            {node.suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onAsk(suggestion.text, node.id)}
                className="bg-white/5 hover:bg-white hover:text-indigo-950 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white/80 backdrop-blur-xl transition-all shadow-lg hover:scale-105 active:scale-95 text-left"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="w-full px-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Evolve this branch..."
              className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-2 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default BubbleNode;