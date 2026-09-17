import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import api from '../../axios';
import { Mic, X, Loader2, RotateCcw, GripVertical } from 'lucide-react';
import MitraVisualizer from './MitraVisualizer';
import { executeUiAction } from '../../voice/actions/uiActionRegistry';

const MitraAssistant = () => {
    const { isAuthenticated, user } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Helper to map app language to TTS voice
    const getTTSLang = (langCode) => {
        let tts = 'en-IN';
        if (langCode) {
            if (langCode.startsWith('mr')) tts = 'mr-IN';
            else if (langCode.startsWith('hi')) tts = 'hi-IN';
            else if (langCode.startsWith('te')) tts = 'te-IN';
            else if (langCode.startsWith('ta')) tts = 'ta-IN';
            else if (langCode.startsWith('bn')) tts = 'bn-IN';
            else if (langCode.startsWith('kn')) tts = 'kn-IN';
            else if (langCode.startsWith('gu')) tts = 'gu-IN';
        }
        return tts;
    };
    
    // ARCHITECTURE STATES
    const [presentationState, setPresentationState] = useState('IDLE');
    const [workflowState, setWorkflowState] = useState(null);
    
    // CONVERSATION CONTEXT
    const [messages, setMessages] = useState([]);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [workflowAwaiting, setWorkflowAwaiting] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // DRAG AND RESIZE STATE
    const controls = useDragControls();
    const [windowPos, setWindowPos] = useState(() => {
        const saved = localStorage.getItem('mitra_pos');
        return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    });
    
    const [windowSize, setWindowSize] = useState(() => {
        const saved = localStorage.getItem('mitra_size');
        return saved ? JSON.parse(saved) : { width: 380, height: 600 };
    });

    useEffect(() => {
        localStorage.setItem('mitra_size', JSON.stringify(windowSize));
        localStorage.setItem('mitra_pos', JSON.stringify(windowPos));
    }, [windowSize, windowPos]);

    const handleResize = useCallback((edge) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startW = windowSize.width;
        const startH = windowSize.height;
        const startX = windowPos.x;
        const startY = windowPos.y;

        const onMouseMove = (moveEvent) => {
            let newW = startW;
            let newH = startH;
            let newX = startX;
            let newY = startY;

            if (edge.includes('left')) {
                const deltaX = moveEvent.clientX - startMouseX;
                newW = Math.max(320, startW - deltaX);
            }
            if (edge.includes('right')) {
                const deltaX = moveEvent.clientX - startMouseX;
                newW = Math.max(320, startW + deltaX);
                newX = startX + (newW - startW);
            }
            if (edge.includes('top')) {
                const deltaY = moveEvent.clientY - startMouseY;
                newH = Math.max(400, startH - deltaY);
            }
            if (edge.includes('bottom')) {
                const deltaY = moveEvent.clientY - startMouseY;
                newH = Math.max(400, startH + deltaY);
                newY = startY + (newH - startH);
            }
            
            newW = Math.min(newW, window.innerWidth * 0.9);
            newH = Math.min(newH, window.innerHeight * 0.9);
            
            setWindowSize({ width: newW, height: newH });
            setWindowPos({ x: newX, y: newY });
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [windowSize, windowPos]);
    
    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const presentationStateRef = useRef('IDLE');
    const workflowAwaitingRef = useRef(null);
    const taskIdRef = useRef(null);
    const chatEndRef = useRef(null);

    // Keep refs in sync
    useEffect(() => { presentationStateRef.current = presentationState; }, [presentationState]);
    useEffect(() => { workflowAwaitingRef.current = workflowAwaiting; }, [workflowAwaiting]);
    useEffect(() => { taskIdRef.current = activeTaskId; }, [activeTaskId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, presentationState, workflowAwaiting]);

    // TASK RESTORATION ON MOUNT
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchActiveTask = async () => {
            try {
                const res = await api.get('/api/voice/intent/active/');
                if (res.data.active) {
                    setActiveTaskId(res.data.task_id);
                    setWorkflowAwaiting(res.data.awaiting);
                    setWorkflowState(res.data.status);
                    // Silently restore task state, don't inject a message that confuses the user.
                }
            } catch (e) {
                console.error("Failed to restore active voice task", e);
            }
        };
        fetchActiveTask();
    }, [isAuthenticated]);

    // AUTHORITATIVE LISTENERS
    useEffect(() => {
        const handleScanStatusUpdate = (event) => {
            const { jobId, status } = event.detail;
            const currentAwaiting = workflowAwaitingRef.current;
            if (currentAwaiting && currentAwaiting.type === 'BACKEND_EVENT' && currentAwaiting.event === 'SCAN_COMPLETED') {
                processWorkflowEvent("SCAN_STATUS_CHANGED", { scan_job_id: jobId });
            }
        };

        const handleScanSubmitted = (event) => {
            const { jobId } = event.detail;
            const currentAwaiting = workflowAwaitingRef.current;
            if (currentAwaiting && currentAwaiting.type === 'APPLICATION_EVENT' && currentAwaiting.event === 'SCAN_SUBMITTED') {
                processWorkflowEvent("SCAN_SUBMITTED", { scan_job_id: jobId });
            }
        };
        
        const handleFarmBoundaryDrawn = (event) => {
            const currentAwaiting = workflowAwaitingRef.current;
            if (currentAwaiting && currentAwaiting.type === 'APPLICATION_EVENT' && currentAwaiting.event === 'FARM_BOUNDARY_DRAWN') {
                processWorkflowEvent("FARM_BOUNDARY_DRAWN");
            }
        };

        const handleFarmCreated = (event) => {
            const { farmId, farmName } = event.detail;
            const currentAwaiting = workflowAwaitingRef.current;
            if (currentAwaiting && currentAwaiting.type === 'BACKEND_EVENT' && currentAwaiting.event === 'FARM_CREATED') {
                processWorkflowEvent("FARM_CREATED", { farm_id: farmId, farm_name: farmName });
            }
        };

        const handleCropCreated = (event) => {
            const currentAwaiting = workflowAwaitingRef.current;
            if (currentAwaiting && currentAwaiting.type === 'BACKEND_EVENT' && currentAwaiting.event === 'CROP_CREATED') {
                processWorkflowEvent("CROP_CREATED");
            }
        };

        window.addEventListener('scanStatusUpdated', handleScanStatusUpdate);
        window.addEventListener('scanSubmitted', handleScanSubmitted);
        window.addEventListener('farmBoundaryDrawn', handleFarmBoundaryDrawn);
        window.addEventListener('mitraFarmCreated', handleFarmCreated);
        window.addEventListener('mitraCropCreated', handleCropCreated);
        
        return () => {
            window.removeEventListener('scanStatusUpdated', handleScanStatusUpdate);
            window.removeEventListener('scanSubmitted', handleScanSubmitted);
            window.removeEventListener('farmBoundaryDrawn', handleFarmBoundaryDrawn);
            window.removeEventListener('mitraFarmCreated', handleFarmCreated);
            window.removeEventListener('mitraCropCreated', handleCropCreated);
        }
    }, []);

    // CANCEL TTS WHEN CLOSED
    useEffect(() => {
        if (!isOpen) {
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPresentationState('IDLE');
        }
    }, [isOpen]);

    const toggleListening = async () => {
        if (!isOpen) {
            setIsOpen(true);
            if (!taskIdRef.current && messages.length === 0) {
                // Initial greeting
                const welcomeMsg = t('mitra.welcome', "Namaste! I'm Mitra. How can I help you with your farm today?");
                setMessages([{
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: welcomeMsg,
                    type: 'text',
                    timestamp: new Date().toISOString()
                }]);
                
                // Map i18n language to TTS language
                const ttsLang = getTTSLang(i18n.language);
                
                speakText(welcomeMsg, ttsLang, 'IDLE');
                return;
            }
        }

        if (presentationState === 'IDLE' || presentationState === 'ERROR') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };
                
                // Use Web Audio API for robust language-agnostic Silence Detection
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.minDecibels = -60; // Silence threshold
                source.connect(analyser);
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                let silenceStart = null;
                const silenceDelay = 2000; // 2 seconds of silence stops recording
                let isRecording = true;
                
                const detectSilence = () => {
                    if (!isRecording || mediaRecorderRef.current?.state !== 'recording') return;
                    
                    analyser.getByteFrequencyData(dataArray);
                    const isTalking = dataArray.some(val => val > 10); // simple volume threshold
                    
                    if (isTalking) {
                        silenceStart = null;
                    } else {
                        if (!silenceStart) {
                            silenceStart = Date.now();
                        } else if (Date.now() - silenceStart > silenceDelay) {
                            if (mediaRecorderRef.current?.state === 'recording') {
                                mediaRecorderRef.current.stop();
                            }
                            return;
                        }
                    }
                    requestAnimationFrame(detectSilence);
                };
                
                detectSilence();
                
                mediaRecorder.onstop = () => {
                    isRecording = false;
                    audioContext.close();
                    const mimeType = mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    
                    if (presentationStateRef.current === 'LISTENING') {
                        // Append user visual message
                        setMessages(prev => [...prev, {
                            id: crypto.randomUUID(),
                            role: 'user',
                            content: 'Audio recorded',
                            type: 'audio-wave',
                            timestamp: new Date().toISOString()
                        }]);
                        processWorkflowEvent("USER_SPOKE", { audio_b64_blob: audioBlob, mimeType });
                    }
                    
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                setPresentationState('LISTENING');
            } catch(e) {
                console.error("Microphone error", e);
                setPresentationState('ERROR');
                setTimeout(() => setPresentationState('IDLE'), 3000);
            }
        } else if (presentationState === 'LISTENING') {
            mediaRecorderRef.current?.stop();
        }
    };

    const processWorkflowEvent = (eventType, payloadData = {}) => {
        setPresentationState('PROCESSING');
        
        const uiContext = { screen: location.pathname };
        const eventId = crypto.randomUUID();

        const sendRequest = async (payload) => {
            try {
                const response = await api.post(`/api/voice/intent/`, {
                    event_id: eventId,
                    task_id: taskIdRef.current,
                    event_type: eventType,
                    payload: payload,
                    ui_context: uiContext
                });
                
                if (response.status === 200) {
                    handleAction(response.data);
                } else {
                    handleErrorResponse(response.data);
                }
            } catch (error) {
                console.error("Voice Workflow Error:", error);
                handleErrorResponse(error.response?.data);
            }
        };

        if (payloadData.audio_b64_blob) {
            const reader = new FileReader();
            reader.readAsDataURL(payloadData.audio_b64_blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                sendRequest({ 
                    audio_b64: base64data, 
                    mime_type: payloadData.mimeType 
                });
            };
        } else {
            sendRequest(payloadData);
        }
    };

    const cancelWorkflow = async () => {
        setPresentationState('PROCESSING');
        try {
            if (taskIdRef.current) {
                await api.post(`/api/voice/intent/`, {
                    event_id: crypto.randomUUID(),
                    task_id: taskIdRef.current,
                    event_type: 'TASK_CANCEL',
                    payload: {},
                    ui_context: { screen: location.pathname }
                });
            }
            
            setActiveTaskId(null);
            setWorkflowAwaiting(null);
            setWorkflowState(null);
            
            // Start a fresh conversation
            const welcomeMsg = t('mitra.welcome', "Namaste! I'm Mitra. How can I help you with your farm today?");
            setMessages([{
                id: crypto.randomUUID(),
                role: 'assistant',
                content: welcomeMsg,
                type: 'text',
                timestamp: new Date().toISOString()
            }]);
            
            // Map i18n language to TTS language
            const ttsLang = getTTSLang(i18n.language);
            
            setPresentationState('IDLE');
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            speakText(welcomeMsg, ttsLang, 'IDLE');
        } catch (error) {
            console.error("Failed to cancel workflow", error);
            setPresentationState('IDLE');
        }
    };
    
    const handleErrorResponse = (data) => {
        setPresentationState('ERROR');
        const errorMsg = data?.message || 'I could not understand that.';
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: errorMsg,
            type: 'text',
            timestamp: new Date().toISOString()
        }]);
        speakText(errorMsg, 'en-IN', 'IDLE');
    };

    const handleAction = (data) => {
        if (data.task && data.task.id) {
            setActiveTaskId(data.task.id);
            setWorkflowState(data.task.status);
        }
        
        setWorkflowAwaiting(data.awaiting || null);
        
        if (data.speech) {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.speech,
                type: 'text',
                timestamp: new Date().toISOString(),
                workflowStep: data.task?.step
            }]);
            setPresentationState('SPEAKING');
            
            // Map Gemini language code to TTS language code
            const ttsLang = getTTSLang(data.task?.language || i18n.language);
            
            speakText(data.speech, ttsLang, 'IDLE');
        } else {
            setPresentationState('IDLE');
        }
        
        // Navigation / UI Actions
        if (data.ui_action) {
            executeUiAction(data.ui_action, navigate);
        }
    };

    const speakText = (text, langCode = 'en-IN', finalState = 'IDLE') => {
        // Always stop any playing fallback audio first
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        window.speechSynthesis.cancel();

        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            const langPrefix = langCode.split('-')[0].toLowerCase();
            
            let selectedVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
            }
            
            // Fallback for Marathi to Hindi if Hindi exists but Marathi doesn't
            if (!selectedVoice && langPrefix === 'mr') {
                selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
            }

            // NETWORK FALLBACK: 
            // If the user's OS doesn't have the regional voice installed (very common for kn, te, ta, gu),
            // fallback to our Django TTS Proxy API for guaranteed playback without CORS issues.
            if (!selectedVoice && langPrefix !== 'en') {
                const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const url = `${backendUrl}/api/voice/tts/?text=${encodeURIComponent(text)}&lang=${langPrefix}`;
                
                const audio = new Audio(url);
                audioRef.current = audio;
                
                audio.onended = () => {
                    setPresentationState(finalState);
                    audioRef.current = null;
                };
                audio.onerror = (e) => {
                    console.error("Network TTS Error:", e);
                    setPresentationState(finalState);
                    audioRef.current = null;
                };
                
                audio.play().catch(e => {
                    console.error("Audio playback failed:", e);
                    setPresentationState(finalState);
                });
                return;
            }

            // NATIVE TTS
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode;
            if (selectedVoice) utterance.voice = selectedVoice;

            utterance.onend = () => setPresentationState(finalState);
            utterance.onerror = (e) => {
                console.error("Native TTS Error:", e);
                setPresentationState(finalState);
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => setPresentationState(finalState), 3000);
        }
    };

    if (!isAuthenticated) return null;

    // Determine the width for desktop (resizable) vs mobile (fixed 100%)
    const isMobile = window.innerWidth < 640;
    const dynamicStyle = isMobile 
        ? { width: '100%', bottom: '80px', right: '0', fontFamily: "'Product Sans', 'Inter', 'Roboto', sans-serif" } 
        : { width: `${windowSize.width}px`, height: `${windowSize.height}px`, fontFamily: "'Product Sans', 'Inter', 'Roboto', sans-serif" };

    return (
        <div className="fixed bottom-24 right-4 z-[9999] flex flex-col items-end gap-4 pointer-events-none sm:bottom-6 sm:right-6">
            
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        drag={!isMobile}
                        dragControls={controls}
                        dragListener={false}
                        dragMomentum={false}
                        onDragEnd={(e, info) => {
                            if (isMobile) return;
                            const newPos = { x: windowPos.x + info.offset.x, y: windowPos.y + info.offset.y };
                            setWindowPos(newPos);
                        }}
                        initial={{ opacity: 0, x: windowPos.x, y: windowPos.y + 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: windowPos.x, y: windowPos.y, scale: 1 }}
                        exit={{ opacity: 0, x: windowPos.x, y: windowPos.y + 20, scale: 0.95 }}
                        className="bg-base-100/30 backdrop-blur-3xl shadow-2xl border border-white/40 dark:bg-black/40 dark:border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col pointer-events-auto relative"
                        style={dynamicStyle}
                    >
                        
                        {/* Custom Resize Handles (Desktop) */}
                        {!isMobile && (
                            <>
                                <div className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={handleResize('left')} />
                                <div className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={handleResize('right')} />
                                <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={handleResize('top')} />
                                <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-50 hover:bg-primary/20 transition-colors" onMouseDown={handleResize('bottom')} />
                                <div className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-[60]" onMouseDown={handleResize('top-left')} />
                                <div className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-[60]" onMouseDown={handleResize('top-right')} />
                                <div className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-[60]" onMouseDown={handleResize('bottom-left')} />
                                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-[60]" onMouseDown={handleResize('bottom-right')} />
                            </>
                        )}

                        {/* Header (Drag Handle) */}
                        <div 
                            onPointerDown={(e) => !isMobile && controls.start(e)}
                            className={`px-5 py-4 bg-primary/90 text-primary-content flex justify-between items-center shadow-sm z-10 sm:rounded-t-3xl border-b border-primary-focus/20 ${!isMobile ? 'cursor-move' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar/Orb */}
                                <div className="w-10 h-10 rounded-full bg-primary-focus flex items-center justify-center shadow-inner overflow-hidden border border-primary-content/20">
                                    <div className={`w-full h-full bg-gradient-to-tr from-green-400 to-primary flex items-center justify-center ${presentationState === 'PROCESSING' ? 'animate-pulse' : ''}`}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white drop-shadow-md">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 22C14.6667 18.6667 16 15.3333 16 12C16 8.66667 14.6667 5.33333 12 2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 2C9.33333 5.33333 8 8.66667 8 12C8 15.3333 9.33333 18.6667 12 22" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M2 12H22" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Mitra</h3>
                                    <span className="text-xs opacity-90 flex items-center gap-1.5 mt-0.5 font-medium tracking-wide">
                                        {presentationState === 'LISTENING' && <><span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse shadow-sm"></span> Listening</>}
                                        {presentationState === 'PROCESSING' && <><span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shadow-sm"></span> Thinking</>}
                                        {presentationState === 'SPEAKING' && <><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-sm"></span> Speaking</>}
                                        {presentationState === 'IDLE' && <><span className="w-1.5 h-1.5 rounded-full bg-success shadow-sm"></span> Assistant</>}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={cancelWorkflow}
                                    className="btn btn-sm btn-ghost btn-circle text-primary-content opacity-70 hover:opacity-100 hover:bg-primary-focus/30"
                                    title="Start New Conversation"
                                >
                                    <RotateCcw size={18} />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="btn btn-sm btn-ghost btn-circle text-primary-content opacity-70 hover:opacity-100 hover:bg-primary-focus/30"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Message List */}
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-transparent">
                            {messages.length === 0 && (
                                <div className="text-center text-base-content/40 my-auto flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
                                        <Mic size={28} className="opacity-40" />
                                    </div>
                                    <span className="text-sm poppins-medium mt-2 max-w-[200px]">Tap the microphone to start talking to Mitra.</span>
                                </div>
                            )}
                            
                            {messages.map((msg) => (
                                <div key={msg.id} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                                    <div className={`chat-bubble text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'chat-bubble-primary text-primary-content' : 'bg-base-100 text-base-content border border-base-200/50'}`}>
                                        {msg.type === 'audio-wave' ? (
                                            <div className="flex items-center gap-1.5 h-5 px-2">
                                                <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-current rounded-full" />
                                                <motion.div animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-current rounded-full" />
                                                <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-current rounded-full" />
                                            </div>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Visualizer Block */}
                            {presentationState !== 'IDLE' && (
                                <div className="flex justify-start w-full my-2">
                                    <MitraVisualizer state={presentationState} />
                                </div>
                            )}
                            
                            {/* Visual Workflow Status Block */}
                            {workflowAwaiting && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mx-1 mt-2 p-3.5 rounded-2xl border border-primary/20 bg-primary/5 text-xs text-base-content shadow-sm relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/40 rounded-l-2xl"></div>
                                    <div className="font-semibold mb-1.5 flex items-center gap-2 text-primary-content/80 pl-2">
                                        {workflowAwaiting.type !== 'USER_INPUT' ? (
                                            <Loader2 size={14} className="animate-spin text-primary" />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        )}
                                        <span className="text-primary tracking-wide">
                                            {workflowAwaiting.type === 'USER_INPUT' ? 'Waiting for your reply' : 
                                             workflowAwaiting.type === 'APPLICATION_EVENT' ? 'Action required in app' : 'Waiting for background task'}
                                        </span>
                                    </div>
                                    <div className="opacity-70 font-medium ml-4 border-l-2 border-primary/20 pl-2 text-sm mt-1">
                                        {workflowAwaiting.input || workflowAwaiting.event || 'Processing...'}
                                    </div>
                                </motion.div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <div className={`pointer-events-auto mt-2 transition-all duration-300 ${isMobile && isOpen ? 'absolute bottom-6 right-6 z-[10000]' : ''}`}>
                <button 
                    onClick={toggleListening}
                    className={`btn btn-circle shadow-xl border-none relative transition-all duration-300 group
                        ${presentationState === 'LISTENING' ? 'bg-error text-error-content hover:bg-error/90 w-16 h-16' : 'bg-primary text-primary-content hover:bg-primary-focus w-14 h-14'}
                    `}
                >
                    {/* Pulsing effect when listening */}
                    {presentationState === 'LISTENING' && (
                        <>
                            <span className="absolute inset-0 rounded-full border-2 border-error animate-ping opacity-70"></span>
                            <span className="absolute -inset-2 rounded-full border border-error animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></span>
                        </>
                    )}
                    
                    {presentationState === 'PROCESSING' ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : (
                        <Mic size={presentationState === 'LISTENING' ? 28 : 24} className={presentationState === 'IDLE' ? 'group-hover:scale-110 transition-transform' : ''} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default MitraAssistant;
