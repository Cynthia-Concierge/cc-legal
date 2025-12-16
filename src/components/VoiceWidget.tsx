import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, FunctionDeclaration, Type } from "@google/genai";
import { Message, ConnectionState, BookingDetails, BusinessConfig } from '../types/widget';
import { decodeBase64, decodeAudioData, createPCMBlob } from '../utils/audioUtils';
import { toast } from '@/hooks/use-toast';
import Visualizer from './Visualizer';

// --- Assets ---
// Placeholder image for the agent - using a more neutral/professional portrait
const AGENT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop";

interface VoiceWidgetProps {
  businessId: string;
  businessConfig?: BusinessConfig;
  apiBaseUrl?: string;
  agentName?: string;
  agentAvatar?: string;
}

const VoiceWidget: React.FC<VoiceWidgetProps> = ({ 
  businessId, 
  businessConfig,
  apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : ""),
  agentName,
  agentAvatar
}) => {
  // --- State ---
  const [isOpen, setIsOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [cameraRequestOpen, setCameraRequestOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [config, setConfig] = useState<BusinessConfig | null>(businessConfig || null);
  const [loadingConfig, setLoadingConfig] = useState(!businessConfig);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');
  
  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null); // Store actual session object
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isConnectedRef = useRef<boolean>(false); // Track connection state
  const isConnectingRef = useRef<boolean>(false); // Prevent multiple connection attempts
  
  // Flag to temporarily suppress mic input when user sends text
  const audioInputSubduedRef = useRef<boolean>(false);
  const subduedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoIntervalRef = useRef<number | null>(null);

  // Check API key status
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      setApiKeyStatus('found');
      console.log("[VoiceWidget] API key found");
    } else {
      setApiKeyStatus('missing');
      console.warn("[VoiceWidget] API key not found. Set VITE_GEMINI_API_KEY in .env file");
    }
  }, []);

  // Load business config if not provided
  useEffect(() => {
    if (!businessConfig && businessId && loadingConfig) {
      loadBusinessConfig();
    }
  }, [businessId, businessConfig, loadingConfig]);

  const loadBusinessConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await fetch(`${apiBaseUrl}/api/business/${businessId}/config`);
      if (!response.ok) throw new Error('Failed to load config');
      const result = await response.json();
      setConfig(result.data);
    } catch (error) {
      console.error('Error loading business config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // --- Scroll to bottom helper ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, cameraRequestOpen]);

  // --- Audio Output Helper ---
  const stopAudioPlayback = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  // --- Cleanup ---
  const stopSession = useCallback(() => {
    console.log("[VoiceWidget] Stopping session and cleaning up...");
    
    // Mark as disconnected first to stop audio processing
    isConnectingRef.current = false;
    isConnectedRef.current = false;
    
    // Stop Audio Processing
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch (e) {
        console.warn("[VoiceWidget] Error disconnecting processor:", e);
      }
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      try {
        inputSourceRef.current.disconnect();
      } catch (e) {
        console.warn("[VoiceWidget] Error disconnecting input source:", e);
      }
      inputSourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn("[VoiceWidget] Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn("[VoiceWidget] Error closing audio context:", e);
      }
      audioContextRef.current = null;
    }
    
    stopAudioPlayback();
    
    if (outputContextRef.current) {
      try {
        outputContextRef.current.close();
      } catch (e) {
        console.warn("[VoiceWidget] Error closing output context:", e);
      }
      outputContextRef.current = null;
    }

    // Stop Video
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn("[VoiceWidget] Error stopping video track:", e);
        }
      });
      videoStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    setIsVideoActive(false);
    setCameraRequestOpen(false);

    // Reset Subdued State
    audioInputSubduedRef.current = false;
    if (subduedTimeoutRef.current) {
      clearTimeout(subduedTimeoutRef.current);
      subduedTimeoutRef.current = null;
    }

    // Close Gemini Session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
        console.log("[VoiceWidget] Session closed");
      } catch (e) {
        console.warn("[VoiceWidget] Session close error:", e);
      }
      sessionRef.current = null;
    }
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
  }, [stopAudioPlayback]);

  // --- Video Handling ---
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsVideoActive(true);
      setCameraRequestOpen(false);

      // Start sending frames
      videoIntervalRef.current = window.setInterval(() => {
        captureAndSendFrame();
      }, 500);

    } catch (err) {
      console.error("Failed to access camera", err);
      toast({
        variant: "destructive",
        title: "Could not access camera",
        description: "Please check your browser camera permissions and try again.",
      });
    }
  };

  const stopVideo = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoActive(false);
  };

  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isConnectedRef.current || !sessionRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];

    if (sessionRef.current && isConnectedRef.current) {
      try {
        // Gemini Live API requires images to be wrapped in input_image
        sessionRef.current.send({
          input_image: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      } catch (e: any) {
        // If WebSocket is closed, stop sending frames
        if (e?.message?.includes('CLOSING') || e?.message?.includes('CLOSED')) {
          console.warn("[VoiceWidget] WebSocket closed, stopping video frames");
          isConnectedRef.current = false;
          stopVideo();
          return;
        }
        console.error("[VoiceWidget] Error sending frame:", e);
      }
    }
  };

  // Build system instruction from business config
  const buildSystemInstruction = (config: BusinessConfig | null): string => {
    if (!config) {
      return `You are a helpful AI assistant.`;
    }

    const businessName = config.name;
    const services = config.services || [];
    const pricing = config.pricing || {};
    const faqs = config.faqs || [];
    const hours = config.hours || "Not specified";
    const bookingType = config.bookingSystem?.type || "mock";

    let instruction = `You are the AI receptionist for ${businessName}.\n\n`;
    instruction += `Your tone is professional, friendly, and helpful.\n\n`;

    if (services.length > 0) {
      instruction += `Available Services:\n`;
      services.forEach((service, index) => {
        instruction += `${index + 1}. ${service.name}`;
        if (service.description) instruction += ` - ${service.description}`;
        if (service.price) instruction += ` - $${service.price}`;
        instruction += `\n`;
      });
      instruction += `\n`;
    }

    if (Object.keys(pricing).length > 0) {
      instruction += `Pricing Information:\n${JSON.stringify(pricing, null, 2)}\n\n`;
    }

    if (faqs.length > 0) {
      instruction += `Frequently Asked Questions:\n`;
      faqs.forEach((faq, index) => {
        instruction += `Q${index + 1}: ${faq.question}\n`;
        instruction += `A${index + 1}: ${faq.answer}\n\n`;
      });
    }

    instruction += `Business Hours: ${hours}\n\n`;

    instruction += `CAPABILITIES:\n`;
    instruction += `1. Book services using the 'bookAppointment' tool.\n`;
    instruction += `2. Analyze skin/body conditions visually using the camera.\n`;
    instruction += `3. Answer questions about services, pricing, and availability.\n\n`;

    instruction += `PROTOCOL:\n`;
    instruction += `- If a user asks for a recommendation, treatment advice, or diagnosis:\n`;
    instruction += `  1. First, say EXACTLY: "I can help with that. Would you like to enable your camera so I can take a look?"\n`;
    instruction += `  2. Wait for their agreement.\n`;
    instruction += `  3. If they agree, IMMEDIATELY call the 'requestCamera' tool with the argument { "reason": "Visual skin or body analysis" }.\n`;
    instruction += `- Once the camera is enabled, provide a gentle, professional visual analysis.\n`;
    instruction += `- Suggest specific treatments based on what you see.\n`;
    instruction += `- Offer to book appointments using 'bookAppointment'.\n\n`;

    if (bookingType === "mock") {
      instruction += `Booking System: Mock/Demo mode. When booking, confirm details and let customers know you'll process the booking.\n`;
    } else {
      instruction += `Booking System: Real booking system (${bookingType}). Use the booking tools to schedule appointments.\n`;
    }

    instruction += `\nKeep responses concise and conversational. Do not output markdown or long lists.`;
    instruction += `Never hallucinate information. Only use what's provided in the business configuration.`;

    return instruction;
  };

  // --- Tools Definition ---
  const createBookingFunction = (config: BusinessConfig | null): FunctionDeclaration => {
    const services = config?.services || [];
    const serviceList = services.length > 0 
      ? services.map(s => s.name).join(', ')
      : 'Various services available';

    return {
      name: 'bookAppointment',
      description: `Book a service for the user. Available services: ${serviceList}.`,
      parameters: {
        type: Type.OBJECT,
        properties: {
          service: { type: Type.STRING, description: 'The service to book.' },
          date: { type: Type.STRING, description: 'The date of the appointment (YYYY-MM-DD).' },
          time: { type: Type.STRING, description: 'The time of the appointment (HH:MM).' },
          customerName: { type: Type.STRING, description: 'Name of the customer.' },
          customerEmail: { type: Type.STRING, description: 'Email of the customer.' },
          customerPhone: { type: Type.STRING, description: 'Phone number of the customer.' }
        },
        required: ['service', 'date', 'time']
      }
    };
  };

  const requestCameraFunction: FunctionDeclaration = {
    name: 'requestCamera',
    description: 'Request the user to turn on their camera for a visual skin or body analysis.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'The reason for requesting the camera.' }
      }
    }
  };

  // --- Connection Handler ---
  const connectToGemini = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || isConnectedRef.current) {
      console.log("[VoiceWidget] Already connecting or connected, skipping...");
      return;
    }

    if (!config) {
      toast({
        title: "Still loading",
        description: "We’re still loading your business configuration. Please wait a moment and try again.",
      });
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionState(ConnectionState.CONNECTING);
      setMessages([]); 

      // Get API key from Vite environment (must be prefixed with VITE_)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        const errorMsg = "Gemini API Key not found. Please set VITE_GEMINI_API_KEY in your .env file.";
        console.error(errorMsg);
        setConnectionState(ConnectionState.ERROR);
        toast({
          variant: "destructive",
          title: "Gemini API key missing",
          description: "Add VITE_GEMINI_API_KEY=your-api-key-here to your .env file and restart the dev server.",
        });
        return;
      }

      console.log("[VoiceWidget] Connecting to Gemini Live with API key:", apiKey.substring(0, 10) + "...");
      const ai = new GoogleGenAI({ apiKey });
      
      // Audio Setup
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = audioStream;

      const bookingFunction = createBookingFunction(config);
      const systemInstruction = buildSystemInstruction(config);

      console.log("[VoiceWidget] Setting up Gemini Live connection...");
      console.log("[VoiceWidget] System instruction length:", systemInstruction.length);
      console.log("[VoiceWidget] Business config:", {
        name: config.name,
        servicesCount: config.services?.length || 0,
        bookingType: config.bookingSystem?.type
      });
      
      // Reset connection state
      isConnectedRef.current = false;
      sessionRef.current = null;
      
      // Validate system instruction format
      if (!systemInstruction || typeof systemInstruction !== 'string' || systemInstruction.trim().length === 0) {
        throw new Error("Invalid system instruction: must be a non-empty string");
      }

      // Validate function declarations
      if (!bookingFunction || !requestCameraFunction) {
        throw new Error("Missing required function declarations");
      }

      console.log("[VoiceWidget] Connecting with config:", {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        systemInstructionLength: systemInstruction.length,
        toolsCount: 2,
        response_modalities: ['audio']
      });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          system_instruction: systemInstruction,
          response_modalities: ['audio'],
          audio_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: 'Kore'
              }
            }
          },
          tools: [
            {
              function_declarations: [
                bookingFunction,
                requestCameraFunction
              ]
            }
          ],
          input_audio_transcription: {},
          output_audio_config: {}
        },
        callbacks: {
          onopen: async () => {
            console.log("[VoiceWidget] Gemini Live connection opened successfully!");
            
            // Wait for session to be ready before storing it
            try {
              const session = await sessionPromise;
              sessionRef.current = session;
              console.log("[VoiceWidget] Session object stored");
              
              // Set connection state AFTER session is ready
              isConnectingRef.current = false;
              isConnectedRef.current = true;
              setConnectionState(ConnectionState.CONNECTED);
              
              // Small delay to ensure connection is fully established
              await new Promise(resolve => setTimeout(resolve, 100));
              
              if (!audioContextRef.current || !streamRef.current) {
                console.warn("[VoiceWidget] Audio context or stream not available");
                return;
              }
              
              try {
                inputSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                
                processorRef.current.onaudioprocess = (e) => {
                  // Check if connection is still active
                  if (!isConnectedRef.current || audioInputSubduedRef.current) {
                    return;
                  }

                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmBlob = createPCMBlob(inputData);
                  
                  // Use stored session reference instead of promise
                  if (sessionRef.current && isConnectedRef.current) {
                    try {
                      // Gemini Live API requires audio to be wrapped in input_audio
                      sessionRef.current.send({
                        input_audio: pcmBlob
                      });
                    } catch (err: any) {
                      // If WebSocket is closed, stop trying to send
                      if (err?.message?.includes('CLOSING') || err?.message?.includes('CLOSED')) {
                        console.warn("[VoiceWidget] WebSocket closed, stopping audio input");
                        isConnectedRef.current = false;
                        setConnectionState(ConnectionState.DISCONNECTED);
                        return;
                      }
                      console.error("[VoiceWidget] Error sending audio input:", err);
                    }
                  }
                  
                  let sum = 0;
                  for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                  setCurrentVolume(Math.sqrt(sum / inputData.length));
                };
                
                inputSourceRef.current.connect(processorRef.current);
                processorRef.current.connect(audioContextRef.current.destination);
                console.log("[VoiceWidget] Audio pipeline set up successfully");
              } catch (error) {
                console.error("[VoiceWidget] Error setting up audio pipeline:", error);
                // Don't close connection on audio setup error
              }
            } catch (err) {
              console.error("[VoiceWidget] Error getting session:", err);
              isConnectingRef.current = false;
              isConnectedRef.current = false;
              setConnectionState(ConnectionState.ERROR);
              return;
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             try {
             // Log message type for debugging
             if (msg.serverContent) {
               console.log("[VoiceWidget] Received message:", {
                 hasInputTranscription: !!msg.serverContent.inputTranscription,
                 hasOutputTranscription: !!msg.serverContent.outputTranscription,
                 hasModelTurn: !!msg.serverContent.modelTurn,
                 hasToolCall: !!msg.toolCall,
                 interrupted: msg.serverContent.interrupted
               });
             }

             // Transcription
             if (msg.serverContent?.inputTranscription?.text) {
                const text = msg.serverContent.inputTranscription.text;
                setMessages(prev => {
                   const last = prev[prev.length - 1];
                   if (last && last.role === 'user') {
                       return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                   }
                   return [...prev, {
                       id: Date.now().toString() + 'user',
                       role: 'user',
                       text: text,
                       timestamp: new Date()
                   }];
                });
             }
             
             if (msg.serverContent?.outputTranscription?.text) {
                 const text = msg.serverContent.outputTranscription.text;
                 setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    }
                    return [...prev, {
                        id: Date.now().toString() + 'ai',
                        role: 'assistant',
                        text: text,
                        timestamp: new Date()
                    }];
                 });
             }

             // Audio
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputContextRef.current) {
                 audioInputSubduedRef.current = false;
                 
                 const ctx = outputContextRef.current;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(decodeBase64(audioData), ctx);
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(ctx.destination);
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
                 source.onended = () => sourcesRef.current.delete(source);
             }

             // Interruption
             if (msg.serverContent?.interrupted) {
                 stopAudioPlayback();
             }

             // Tool Calls
             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                   if (fc.name === 'bookAppointment') {
                       const args = fc.args as unknown as BookingDetails;
                       
                       // Call booking API
                       try {
                         const bookingResponse = await fetch(`${apiBaseUrl}/api/appointments/mock`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                             businessId: businessId,
                             service: args.service,
                             date: args.date,
                             time: args.time,
                             customerName: args.customerName || 'Customer',
                             customerEmail: args.customerEmail || '',
                             customerPhone: args.customerPhone || ''
                           })
                         });

                         if (bookingResponse.ok) {
                           setMessages(prev => [...prev, {
                               id: Date.now().toString() + 'sys',
                               role: 'system',
                               text: `📅 Booking confirmed: ${args.service} on ${args.date} at ${args.time}`,
                               timestamp: new Date()
                           }]);
                         }
                       } catch (error) {
                         console.error('Booking error:', error);
                       }

                       if (sessionRef.current && isConnectedRef.current) {
                         try {
                           sessionRef.current.sendToolResponse({
                               functionResponses: {
                                   id: fc.id,
                                   name: fc.name,
                                   response: { result: "Success: Appointment booked." }
                               }
                           });
                         } catch (err) {
                           console.error("[VoiceWidget] Error sending tool response:", err);
                         }
                       }
                   } else if (fc.name === 'requestCamera') {
                       setCameraRequestOpen(true);
                       if (sessionRef.current && isConnectedRef.current) {
                         try {
                           sessionRef.current.sendToolResponse({
                               functionResponses: {
                                   id: fc.id,
                                   name: fc.name,
                                   response: { result: "User Prompted" }
                               }
                           });
                         } catch (err) {
                           console.error("[VoiceWidget] Error sending tool response:", err);
                         }
                       }
                   }
                }
             }
             } catch (msgError) {
               console.error("[VoiceWidget] Error processing message:", msgError);
               // Don't close connection on message processing errors
             }
          },
          onclose: (event) => {
             console.log("[VoiceWidget] Gemini Live connection closed", {
               code: event?.code,
               reason: event?.reason,
               wasClean: event?.wasClean,
               timestamp: new Date().toISOString()
             });
             
             // Only update state if we were actually connected
             if (isConnectedRef.current || isConnectingRef.current) {
               isConnectingRef.current = false;
               isConnectedRef.current = false;
               sessionRef.current = null;
               setConnectionState(ConnectionState.DISCONNECTED);
               
               // Stop audio processing when connection closes
               if (processorRef.current) {
                 try {
                   processorRef.current.disconnect();
                   processorRef.current.onaudioprocess = null;
                 } catch (e) {
                   console.warn("[VoiceWidget] Error disconnecting processor:", e);
                 }
               }
             }
          },
          onerror: (err) => {
             console.error("[VoiceWidget] Gemini Live Error:", err);
             console.error("[VoiceWidget] Error details:", {
               message: err instanceof Error ? err.message : String(err),
               stack: err instanceof Error ? err.stack : undefined,
               name: err instanceof Error ? err.name : undefined
             });
             isConnectingRef.current = false;
             isConnectedRef.current = false;
             sessionRef.current = null;
             setConnectionState(ConnectionState.ERROR);
             setMessages(prev => [...prev, {
               id: Date.now().toString() + 'error',
               role: 'system',
               text: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
               timestamp: new Date()
             }]);
             stopSession();
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("[VoiceWidget] Connection failed:", error);
      isConnectingRef.current = false;
      setConnectionState(ConnectionState.ERROR);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'error',
        role: 'system',
        text: `Failed to connect: ${errorMessage}`,
        timestamp: new Date()
      }]);
      
      // Show user-friendly error
      if (errorMessage.includes('API Key')) {
        toast({
          variant: "destructive",
          title: "API key error",
          description: `${errorMessage} Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: `${errorMessage} Check the browser console for more details.`,
        });
      }
    }
  };

  const handleToggle = () => {
      if (isOpen) {
          stopSession();
          setIsOpen(false);
      } else {
          setIsOpen(true);
      }
  };

  const handleMicClick = () => {
      if (connectionState === ConnectionState.CONNECTED) {
          stopSession();
      } else if (connectionState === ConnectionState.CONNECTING) {
          console.log("[VoiceWidget] Already connecting, please wait...");
          return;
      } else {
          connectToGemini();
      }
  };

  const handleAllowCamera = () => {
      startVideo();
  };

  const handleDenyCamera = () => {
      setCameraRequestOpen(false);
  };

  const handleSendText = () => {
      if (!inputText.trim() || connectionState !== ConnectionState.CONNECTED || !sessionPromiseRef.current) return;
      
      const text = inputText.trim();
      
      setMessages(prev => [...prev, {
          id: Date.now().toString() + 'user',
          role: 'user',
          text: text,
          timestamp: new Date()
      }]);
      
      setInputText('');
      stopAudioPlayback();
      audioInputSubduedRef.current = true;
      
      if (subduedTimeoutRef.current) clearTimeout(subduedTimeoutRef.current);
      subduedTimeoutRef.current = setTimeout(() => {
          audioInputSubduedRef.current = false;
      }, 2000);

      if (sessionRef.current && isConnectedRef.current) {
        try {
          // Gemini Live API requires text to be wrapped in input_text
          sessionRef.current.send({
            input_text: text
          });
        } catch (err) {
          console.error("[VoiceWidget] Error sending text message:", err);
          audioInputSubduedRef.current = false;
        }
      } else {
        console.warn("[VoiceWidget] Cannot send text - session not connected");
        audioInputSubduedRef.current = false;
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSendText();
      }
  };

  const displayName = agentName || config?.name || 'AI Assistant';
  const displayAvatar = agentAvatar || config?.images?.logo || AGENT_AVATAR;

  if (loadingConfig) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show API key warning if missing (only show in widget, not prevent rendering)
  const showApiKeyWarning = apiKeyStatus === 'missing';

  return (
    <>
        {/* Floating Action Button */}
        {!isOpen && (
            <button 
                onClick={handleToggle}
                className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 hover:bg-black text-white rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center group border border-white/10"
            >
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-pulse">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
            </button>
        )}

        {/* Widget Modal */}
        {isOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-[360px] md:w-[380px] h-[640px] flex flex-col glass-panel rounded-3xl shadow-2xl animate-[fadeIn_0.3s_ease-out] overflow-hidden border border-white/40 font-sans ring-1 ring-black/5">
                
                {/* Header */}
                <div className="bg-white/80 p-5 border-b border-slate-100 flex items-center justify-between backdrop-blur-md z-10 relative">
                    {showApiKeyWarning && (
                      <div className="absolute top-2 left-2 right-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-2 mb-2 z-20">
                        <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                          ⚠️ API Key Missing: Set VITE_GEMINI_API_KEY in .env
                        </p>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img src={displayAvatar} alt="Agent" className="w-12 h-12 rounded-full border border-slate-100 object-cover shadow-sm" />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${connectionState === ConnectionState.CONNECTED ? 'bg-emerald-500' : apiKeyStatus === 'missing' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-serif text-lg font-bold text-slate-900 leading-none mb-1">{displayName}</h3>
                            <div className="flex items-center space-x-2">
                                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">AI Concierge</p>
                                {connectionState === ConnectionState.CONNECTED && (
                                     <div className="scale-75 origin-left opacity-60"><Visualizer isActive={true} color="#1e293b" /></div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {connectionState === ConnectionState.CONNECTED && (
                             <button 
                                onClick={stopSession} 
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 transition-all"
                                title="End Session"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                             </button>
                        )}
                        <button onClick={handleToggle} className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area: Video or Chat */}
                <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                    
                    {/* Hidden Elements for Video Processing */}
                    <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera Active View */}
                    {isVideoActive && (
                        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                            <video 
                                ref={ref => {
                                    if (ref && videoStreamRef.current) ref.srcObject = videoStreamRef.current;
                                }}
                                className="w-full h-full object-cover transform -scale-x-100 opacity-90"
                                autoPlay 
                                muted 
                                playsInline 
                            />
                            <div className="absolute top-4 left-0 right-0 flex justify-center">
                                <span className="bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider backdrop-blur-md border border-white/10 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    LIVE ANALYSIS
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className={`absolute inset-0 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth z-10 ${isVideoActive ? 'bg-gradient-to-t from-black/80 via-transparent to-transparent pt-32' : ''}`}>
                        
                        {messages.length === 0 && connectionState !== ConnectionState.CONNECTED && (
                             <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                </div>
                                <h4 className="font-serif text-2xl text-slate-800 mb-2">Welcome</h4>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                                    I'm {displayName}'s AI assistant. How can I help you today?
                                </p>
                             </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                                <div className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-slate-900 text-white rounded-2xl rounded-br-none' 
                                        : msg.role === 'system'
                                        ? 'bg-transparent text-slate-500 border border-slate-200/50 rounded-xl w-full text-center text-xs font-medium py-2'
                                        : isVideoActive 
                                            ? 'bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl rounded-bl-none border border-white/50'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Camera Permission Request Overlay */}
                    {cameraRequestOpen && !isVideoActive && (
                        <div className="absolute inset-0 z-20 flex items-end justify-center pb-6 px-4 bg-slate-900/10 backdrop-blur-[2px] animate-[fadeIn_0.3s]">
                            <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-auto border border-slate-100 ring-1 ring-black/5">
                                <div className="flex items-start space-x-4 mb-5">
                                    <div className="bg-slate-100 p-3 rounded-full text-slate-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">Allow Camera Access?</h4>
                                        <p className="text-sm text-slate-500 mt-1 leading-normal">I require camera access to perform a personalized visual analysis.</p>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={handleDenyCamera} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Decline</button>
                                    <button onClick={handleAllowCamera} className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-black shadow-lg transition-colors">Allow Camera</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Area */}
                <div className="p-4 bg-white border-t border-slate-100 z-20">
                     
                     {connectionState === ConnectionState.CONNECTED ? (
                        /* Connected: Chat Interface */
                        <div className="flex items-center space-x-3">
                            {/* Camera Toggle */}
                             <button 
                                onClick={isVideoActive ? stopVideo : startVideo}
                                className={`p-3 rounded-full transition-all flex items-center justify-center ${
                                    isVideoActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                                title={isVideoActive ? "Turn Camera Off" : "Turn Camera On"}
                             >
                                {isVideoActive ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                )}
                             </button>

                             {/* Text Input */}
                             <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message..."
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-full py-3.5 px-5 pl-5 pr-10 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all placeholder:text-slate-400"
                                />
                             </div>

                             {/* Send Button */}
                             <button 
                                onClick={handleSendText}
                                disabled={!inputText.trim()}
                                className={`p-3.5 rounded-full transition-all shadow-sm flex items-center justify-center transform ${
                                    inputText.trim() 
                                    ? 'bg-slate-900 text-white hover:bg-black hover:scale-105 active:scale-95' 
                                    : 'bg-slate-100 text-slate-300'
                                }`}
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                             </button>
                        </div>
                     ) : (
                        /* Disconnected: Start Button */
                        <div className="flex flex-col items-center space-y-4">
                            {showApiKeyWarning && (
                              <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-3 mb-2">
                                <p className="text-xs text-red-700 dark:text-red-300 text-center">
                                  <strong>API Key Required:</strong> Add VITE_GEMINI_API_KEY to .env and restart
                                </p>
                              </div>
                            )}
                            <button 
                                onClick={handleMicClick}
                                disabled={showApiKeyWarning}
                                className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/10 ${
                                  showApiKeyWarning 
                                    ? 'bg-slate-400 text-white cursor-not-allowed' 
                                    : 'bg-slate-900 text-white hover:bg-black'
                                }`}
                            >
                                {connectionState === ConnectionState.CONNECTING ? (
                                    <span className="animate-pulse flex items-center gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                        Connecting...
                                    </span>
                                ) : showApiKeyWarning ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        <span>API Key Required</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                        <span>Start Conversation</span>
                                    </>
                                )}
                            </button>
                             <div className="flex items-center space-x-2 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                                 <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" className="w-4 h-4" alt="Gemini" />
                                 <p className="text-[10px] text-slate-500 font-medium tracking-wide">Powered by Gemini</p>
                             </div>
                        </div>
                     )}
                </div>
            </div>
        )}
    </>
  );
};

export default VoiceWidget;

