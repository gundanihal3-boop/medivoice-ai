import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Send, Bot, User, AlertCircle, Calendar, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { CallSession } from '../types';
import { interactWithCall, startCallSession } from '../api';

interface LiveCallViewProps {
  onCallUpdated: () => void;
}

export const LiveCallView: React.FC<LiveCallViewProps> = ({ onCallUpdated }) => {
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.transcript]);

  // Initialize Web Speech API Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        console.log('🎤 Speech recognized:', transcriptText);
        setIsListening(false);
        handleSendMessage(transcriptText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentSession]);

  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      const session = await startCallSession();
      setCurrentSession(session);
      setIsCalling(true);
      onCallUpdated();

      // Speak initial greeting
      if (session.transcript.length > 0 && voiceEnabled) {
        speakText(session.transcript[0].text);
      }
    } catch (err: any) {
      alert('Failed to start call session: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onCallUpdated();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !currentSession || isLoading) return;

    try {
      setIsLoading(true);
      setInputText('');

      const { aiResponse, session } = await interactWithCall(currentSession.callId, text);
      setCurrentSession(session);
      onCallUpdated();

      // TTS voice output
      if (voiceEnabled && aiResponse) {
        speakText(aiResponse);
      }
    } catch (err: any) {
      alert('AI communication error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. You can use text mode below!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Mic start error:', e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainderSecs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Control Panel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md transition-all ${
            isCalling ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">
                {isCalling ? '🟢 CALL ACTIVE' : 'CALL SIMULATOR IDLE'}
              </h2>
              {isCalling && (
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Duration: {formatDuration(callDuration)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isCalling ? `Call ID: ${currentSession?.callId} • Real-time Speech & Intent Pipeline` : 'Click Start Call to initiate browser voice or text conversation with MediVoice AI.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              voiceEnabled ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🔊 Text-to-Speech: {voiceEnabled ? 'ON' : 'OFF'}
          </button>

          {!isCalling ? (
            <button
              onClick={handleStartCall}
              disabled={isLoading}
              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>🎙️ Start Voice Call</span>
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Active Session Details & Live Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Call Info & Extracted Intent */}
        <div className="space-y-4">
          {/* Active Call Details Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Detected Call Context</span>
            </h3>

            <div className="space-y-3 divide-y divide-slate-800 text-xs">
              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Caller Identification:</span>
                <span className="font-bold text-slate-100">{currentSession?.patientId || 'Pending Verification'}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Reason for Visit:</span>
                <span className="font-semibold text-slate-200">{currentSession?.reasonForVisit || 'Not extracted yet'}</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Mapped Department:</span>
                <span className="font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {currentSession?.department || 'General Medicine'}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Urgency Assessment:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  currentSession?.urgency === 'routine' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' :
                  currentSession?.urgency === 'potentially_urgent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  currentSession?.urgency === 'emergency' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-bounce' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {currentSession?.urgency ? currentSession.urgency.toUpperCase() : 'ROUTINE'}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Booking Status:</span>
                <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentSession?.bookingStatus || 'Initiated'}</span>
                </span>
              </div>
            </div>

            {currentSession?.escalated && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 space-y-1">
                <div className="font-bold flex items-center space-x-1 text-red-400">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>HUMAN ESCALATION TRIGGERED</span>
                </div>
                <p>{currentSession.escalationReason || 'Emergency symptom protocol activated.'}</p>
              </div>
            )}
          </div>

          {/* Quick Scenario Triggers for Demo */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Simulation Prompts</h4>
            <div className="space-y-1.5 text-xs">
              <button
                disabled={!isCalling}
                onClick={() => handleSendMessage("I want to see a doctor. I have a skin rash on my arms.")}
                className="w-full text-left p-2 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-cyan-500/40 transition-colors font-medium text-slate-200 disabled:opacity-40"
              >
                1. "Skin rash consultation" (Routine Dermatology)
              </button>
              <button
                disabled={!isCalling}
                onClick={() => handleSendMessage("Yes, my registered mobile number is 9876543210.")}
                className="w-full text-left p-2 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-cyan-500/40 transition-colors font-medium text-slate-200 disabled:opacity-40"
              >
                2. "Verify mobile 9876543210" (Rahul Kumar)
              </button>
              <button
                disabled={!isCalling}
                onClick={() => handleSendMessage("Yes, please book tomorrow's 2 PM appointment.")}
                className="w-full text-left p-2 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800 hover:border-cyan-500/40 transition-colors font-medium text-slate-200 disabled:opacity-40"
              >
                3. "Yes, book 2 PM slot" (Confirm Booking)
              </button>
              <button
                disabled={!isCalling}
                onClick={() => handleSendMessage("I am having severe chest pain and difficulty breathing.")}
                className="w-full text-left p-2 bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors font-bold disabled:opacity-40"
              >
                4. "Severe chest pain" (AI Safety Emergency Test)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Conversation Feed & Input */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md flex flex-col h-[560px]">
          {/* Transcript Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm text-white">Live Voice & Text Conversation Feed</span>
            </div>
            {isListening && (
              <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 font-bold px-2.5 py-1 rounded-full animate-pulse flex items-center space-x-1">
                <Mic className="w-3.5 h-3.5" />
                <span>Listening to Microphone...</span>
              </span>
            )}
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
            {(!currentSession || currentSession.transcript.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3 border border-slate-700">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">No Active Call Session</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Click the green <strong>Start Voice Call</strong> button at the top to launch an interactive speech/text session with MediVoice AI.
                </p>
              </div>
            ) : (
              currentSession.transcript.map((msg, index) => {
                const isAi = msg.speaker === 'ai';
                return (
                  <div key={index} className={`flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isAi ? 'bg-cyan-600 text-slate-950 font-extrabold' : 'bg-slate-700 text-white'
                    }`}>
                      {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-md rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isAi
                        ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                        : 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                    }`}>
                      <div className={`flex justify-between items-center mb-1 text-[10px] font-semibold ${isAi ? 'text-slate-400' : 'text-slate-900/80'}`}>
                        <span>{isAi ? 'MediVoice AI' : 'Patient'}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Input Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleVoiceListening}
                disabled={!isCalling || isLoading}
                className={`p-3 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-600 text-white border-red-600 animate-pulse'
                    : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border-slate-700'
                } disabled:opacity-40`}
                title="Toggle microphone speech recognition"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan-400" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isCalling ? "Type patient message here (or speak via Mic)..." : "Start call to enable conversation..."}
                disabled={!isCalling || isLoading}
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-40"
              />

              <button
                type="submit"
                disabled={!isCalling || !inputText.trim() || isLoading}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-3 rounded-xl shadow-md transition-all disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
