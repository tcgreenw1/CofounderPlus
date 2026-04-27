/**
 * Voice Chat Component
 * Provides voice input/output for Cofounder AI chat
 * Uses Web Speech API for voice input and OpenAI TTS for voice output
 * Only available for Scale tier users
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface VoiceChatProps {
  onTranscript: (text: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function VoiceChat({
  onTranscript,
  onVoiceStart,
  onVoiceEnd,
  disabled = false,
  isProcessing = false
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
          onVoiceStart?.();
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const currentTranscript = finalTranscript || interimTranscript;
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('🎤 Voice recognition error:', event.error);
          if (event.error === 'no-speech') {
            toast.error('No speech detected. Please try again.');
          } else if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please enable microphone permissions.');
          } else {
            toast.error(`Voice recognition error: ${event.error}`);
          }
          stopListening();
        };

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          if (transcript.trim()) {
            onTranscript(transcript.trim());
          }
          setIsListening(false);
          setTranscript('');
          onVoiceEnd?.();
        };

        recognitionRef.current = recognition;
      } else {
        console.warn('🎤 Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('🎤 Failed to stop recognition:', error);
      }
    }
  };

  const speakText = async (text: string) => {
    if (!text || isSpeaking) return;

    setIsLoadingAudio(true);
    setIsSpeaking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      console.log('🔊 Generating speech for text...');

      // Call backend to generate speech using OpenAI TTS
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/voice/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        
        // Play next in queue if available
        if (audioQueueRef.current.length > 0) {
          const nextText = audioQueueRef.current.shift();
          if (nextText) {
            speakText(nextText);
          }
        }
      };

      audio.onerror = (error) => {
        console.error('🔊 Audio playback error:', error);
        setIsSpeaking(false);
        toast.error('Failed to play audio');
      };

      await audio.play();
      setIsLoadingAudio(false);
      console.log('🔊 Playing speech...');
    } catch (error: any) {
      console.error('🔊 Text-to-speech error:', error);
      toast.error(error.message || 'Failed to generate speech');
      setIsSpeaking(false);
      setIsLoadingAudio(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
    audioQueueRef.current = [];
  };

  return {
    isListening,
    isSpeaking,
    isLoadingAudio,
    transcript,
    startListening,
    stopListening,
    speakText,
    stopSpeaking
  };
}

interface VoiceChatControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
  transcript?: string;
}

export function VoiceChatControls({
  isListening,
  isSpeaking,
  isLoadingAudio,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  disabled = false,
  transcript = ''
}: VoiceChatControlsProps) {
  return (
    <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
      {/* Voice Input Button */}
      <Button
        onClick={isListening ? onStopListening : onStartListening}
        disabled={disabled || isSpeaking}
        variant={isListening ? 'default' : 'outline'}
        size="icon"
        className="relative"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: isListening 
            ? 'linear-gradient(135deg, #ff4f50, #ff3333)' 
            : undefined,
          borderColor: isListening ? 'transparent' : 'var(--border)',
        }}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <MicOff className="size-4" />
            <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="size-4" />
        )}
      </Button>

      {/* Voice Output Button */}
      <Button
        onClick={isSpeaking ? onStopSpeaking : undefined}
        disabled={disabled || !isSpeaking || isLoadingAudio}
        variant={isSpeaking ? 'default' : 'ghost'}
        size="icon"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: isSpeaking 
            ? 'linear-gradient(135deg, #2b7fff, #1e5dd9)' 
            : undefined,
          opacity: isSpeaking ? 1 : 0.5,
        }}
        title={isSpeaking ? 'Stop speaking' : 'Voice output active'}
      >
        {isLoadingAudio ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isSpeaking ? (
          <>
            <VolumeX className="size-4" />
            <span className="absolute -top-1 -right-1 size-3 bg-blue-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Volume2 className="size-4" />
        )}
      </Button>

      {/* Live transcript indicator */}
      {isListening && transcript && (
        <div 
          className="text-xs text-muted-foreground animate-pulse"
          style={{ maxWidth: '200px' }}
        >
          Listening: {transcript.substring(0, 50)}...
        </div>
      )}
    </div>
  );
}
