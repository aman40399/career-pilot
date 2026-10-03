import { triggerConfetti } from '../utils/confetti'
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, XCircle, CheckCircle, CheckCircle2, AlertCircle, Volume2, VolumeX, RotateCcw, UserX, Loader2, Sparkles, ArrowRight, Target, TrendingUp, MessageSquare, Eye, Brain, Award, ChevronDown, ChevronUp, Clock, BarChart3, Lightbulb, Zap, Laptop, Smartphone, Chrome, AlertTriangle, FileUp, FileText, X, Globe, Code2, Play, Link as LinkIcon, Share2, Download, ShieldCheck, Terminal, Cpu, PhoneOff, Radio } from 'lucide-react';
import Button from '../components/Button';
import BodyLanguageTips from '../components/BodyLanguageTips';
import VoiceToTextButton from '../components/VoiceToTextButton';
import { interviewApi, uploadApi, resumeApi } from '../services/api';
import ConfidenceMeter from "../components/ConfidenceMeter";
import {DEFAULT_PROGRESS,updateDifficulty} from '../utils/interviewDifficulty';
import LearningRecommendations from "../components/LearningRecommendations";
import CopyButton from '../components/CopyButton';
import QuestionAnalysisCard from '../components/interview/QuestionAnalysisCard';
import AvatarInterviewer from '../components/interview/AvatarInterviewer';
import { useAIConfigStore } from '../stores/useAIConfigStore';
import { SUPPORTED_LANGUAGES, getLanguage, DEFAULT_LANGUAGE_CODE } from '../constants/languages';
import { captureCardToBlob, downloadBlob, shareImage, buildShareCaption } from '../utils/shareCard';
import { whisperManager } from '../services/whisperService';

// Code editor (Monaco) — ~3MB chunk, lazy-loaded only when mode === 'coding'
const CodeEditor = lazy(() => import('../components/interview/CodeEditor'));
const CodingQuestionCard = lazy(() => import('../components/interview/CodingQuestionCard'));
const ShareCard = lazy(() => import('../components/ShareCard'));

// Device and browser detection utilities
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  // Check for mobile user agents
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  // Also check screen width as fallback
  const isMobileWidth = window.innerWidth <= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return mobileRegex.test(userAgent.toLowerCase()) || (isMobileWidth && isTouchDevice);
};

const isChromeBrowser = () => {
  const userAgent = navigator.userAgent;
  // Check for Chrome but not Edge (which also contains Chrome in UA)
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isEdge = /Edg/.test(userAgent);
  return isChrome && !isEdge;
};

const INDUSTRIES = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'product_management', label: 'Product Management' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'consulting', label: 'Consulting' }
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' }
];

const INTERVIEW_MODES = [
  { value: 'technical', label: 'Technical', desc: 'Domain knowledge & reasoning' },
  { value: 'behavioral', label: 'Behavioral', desc: 'Soft-skill & STAR-method questions' },
  { value: 'coding', label: 'Coding', desc: 'Live code with test cases' },
  { value: 'mixed', label: 'Mixed', desc: 'Behavioral + technical blend' }
];

const CODING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' }
];

const SUGGESTED_ROLES = [
  "Senior Backend Engineer",
  "AI/ML Systems Engineer",
  "Full-Stack Architect",
  "Distributed Systems Engineer",
  "Cloud Infrastructure Engineer"
];








export default function InterviewPrep() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('setup'); // 'setup' | 'warmup' | 'av-check' | 'interview' | 'feedback'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Device/browser compatibility state
  const [isMobile, setIsMobile] = useState(false);
  const [isChrome, setIsChrome] = useState(true);

  // A/V confirmation state
  const [avConfirmed, setAvConfirmed] = useState(false);
  const [avCheckStream, setAvCheckStream] = useState(null);
  const [avVideoWorking, setAvVideoWorking] = useState(false);
  const [avAudioWorking, setAvAudioWorking] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const avVideoRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const initialMode = location.state?.mode || queryParams.get('mode') || 'behavioral';

  const [formData, setFormData] = useState({
    jobRole: location.state?.jobRole || '',
    industry: 'software_engineering',
    experienceLevel: 'entry',
    questionCount: 10,
    language: 'en',
    mode: initialMode,
    companyName: '',
    codingLanguage: 'javascript',
    jdText: '',
    skipWarmup: false
  });

  // Sync mode whenever URL search param changes (e.g. navigation clicks)
  useEffect(() => {
    const qMode = new URLSearchParams(location.search).get('mode');
    if (qMode && ['technical', 'behavioral', 'coding', 'mixed'].includes(qMode)) {
      setFormData(prev => ({ ...prev, mode: qMode }));
    }
  }, [location.search]);

  // Ensure camera stream connects to video element in setup confirm step
  useEffect(() => {
    if (step === 'av-check') {
      if (avVideoRef.current && avCheckStream) {
        avVideoRef.current.srcObject = avCheckStream;
      }
      if (navigator.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then((devs) => {
          const vDevs = devs.filter((d) => d.kind === 'videoinput');
          setVideoDevices(vDevs);
          const iriun = vDevs.find((d) => d.label?.toLowerCase().includes('iriun'));
          if (iriun && selectedVideoDeviceId !== iriun.deviceId) {
            setSelectedVideoDeviceId(iriun.deviceId);
            initializeAVCheck(iriun.deviceId);
          }
        }).catch(() => {});
      }
    }
  }, [step]);

  // Resume upload state
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(location.state?.resumeId || 'none');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState(location.state?.resumeText || '');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const resumeInputRef = useRef(null);
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [codingQuestion, setCodingQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [faceVisible, setFaceVisible] = useState(true);
  const [faceConfidence, setFaceConfidence] = useState(50);
  const [answersSubmitted, setAnswersSubmitted] = useState([]);
  const [warmupQuestions, setWarmupQuestions] = useState([]);
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [code, setCode] = useState('');
  const [runResults, setRunResults] = useState(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [jdInput, setJdInput] = useState('');
  const [jdMode, setJdMode] = useState('none'); // 'none' | 'paste' | 'url'
  const [jdLoading, setJdLoading] = useState(false);
  const [jdError, setJdError] = useState('');
  const [jdSummary, setJdSummary] = useState(null); // { role, company, jdText }
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [showSwitchProvider, setShowSwitchProvider] = useState(false);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const shareCardRef = useRef(null);
  
  const [useTextInput, setUseTextInput] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [whisperState, setWhisperState] = useState(whisperManager.getState());
  const [meetingTimer, setMeetingTimer] = useState(0);

  useEffect(() => {
    const unsub = whisperManager.subscribe(setWhisperState);
    return () => unsub();
  }, []);

  useEffect(() => {
    let intv = null;
    if (step === 'interview') {
      intv = setInterval(() => setMeetingTimer((t) => t + 1), 1000);
      if (whisperManager.getState().status === 'idle') {
        whisperManager.loadModel().catch(() => {});
      }
    }
    return () => {
      if (intv) clearInterval(intv);
    };
  }, [step]);

  const [overallResults, setOverallResults] = useState(null);
  const [progressData, setProgressData] = useState(() => {

  const stored =
    localStorage.getItem(
      "interviewProgress"
    );

  return stored
    ? JSON.parse(stored)
    : DEFAULT_PROGRESS;

});
  const [expressionSamples, setExpressionSamples] = useState([]);

  // Active AI config (BYOK) — for the avatar and provider-switch modal
  const activeConfig = useAIConfigStore((s) => s.activeProvider);
  const configuredProviders = useAIConfigStore((s) => s.providers);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);

  const visualizerCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Check device and browser on mount
  useEffect(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);
    setIsChrome(isChromeBrowser());

    // Re-check on resize
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile we auto-route to text-answer mode because (a) Web Speech API
  // is unreliable on mobile Chrome/Safari and (b) many users prefer typing on
  // a phone keyboard. Desktop users still get voice-first UX by default.
  useEffect(() => {
    if (isMobile) setUseTextInput(true);
  }, [isMobile]);

  // Check BYOK config and fetch saved resumes
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Check BYOK
      const activeConfig = useAIConfigStore.getState().getActiveConfig();
      const hasStoreKey = !!activeConfig?.apiKey;
      const legacyConfigStr = localStorage.getItem('aiConfig');
      let hasLegacyKey = false;
      try { hasLegacyKey = legacyConfigStr && JSON.parse(legacyConfigStr).apiKey; } catch(e) {}
      const hasOpenRouterKey = localStorage.getItem('openRouterApiKey');
      
      if (!hasStoreKey && !hasLegacyKey && !hasOpenRouterKey) {
        navigate('/settings?tab=ai&return_url=/interview-prep');
        return;
      }

      // Fetch saved resumes
      try {
        const response = await resumeApi.getAll();
        let fetchedResumes = [];
        if (Array.isArray(response)) fetchedResumes = response;
        else if (Array.isArray(response.data)) fetchedResumes = response.data;
        else if (Array.isArray(response.resumes)) fetchedResumes = response.resumes;
        else if (response.data && Array.isArray(response.data.resumes)) fetchedResumes = response.data.resumes;
        
        setSavedResumes(fetchedResumes);
      } catch (err) {
        console.error('Failed to fetch saved resumes:', err);
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    if (step === 'interview') initializeMedia();
    return () => {
      cleanupMedia();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [step]);

  // Cleanup AV check stream when moving to interview
  useEffect(() => {
    if (step !== 'av-check' && avCheckStream) {
      avCheckStream.getTracks().forEach(track => track.stop());
      setAvCheckStream(null);
    }
  }, [step, avCheckStream]);

  useEffect(() => {
    if (step === 'interview' && questions.length > 0) {
      speakQuestion(questions[currentQuestionIndex]?.question);
    }
  }, [currentQuestionIndex, step, questions]);

  useEffect(() => {
    if (isRecording) {
      faceCheckIntervalRef.current = setInterval(checkFaceVisibility, 1000);
    } else {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    }
    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [isRecording]);

  const initializeMedia = async () => {
    try {
      const videoConstraints = selectedVideoDeviceId
        ? { deviceId: { exact: selectedVideoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVideoEnabled(true);

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 75;
      canvasRef.current = canvas;
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
    } catch (err) {
      console.warn('initializeMedia failed with specified video+audio:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setVideoEnabled(true);
      } catch (e2) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = audioStream;
        } catch (e3) {}
        setVideoEnabled(false);
      }
    }
  };

  const checkFaceVisibility = () => {
    if (!videoRef.current || !ctxRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    const ctx = ctxRef.current;
    ctx.drawImage(video, 0, 0, 100, 75);
    const imageData = ctx.getImageData(0, 0, 100, 75);
    const data = imageData.data;

    let skinTonePixels = 0;
    let brightness = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      brightness += (r + g + b) / 3;
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) skinTonePixels++;
    }

    brightness = brightness / totalPixels;
    const skinRatio = skinTonePixels / totalPixels;
    const detected = skinRatio > 0.08 && brightness > 40 && brightness < 230;

    setFaceVisible(detected);
    if (detected) {
  const confidence =
    Math.min(100, Math.max(40, 50 + skinRatio * 200));

  setFaceConfidence(confidence);

  setExpressionSamples(prev => [
    ...prev.slice(-60),
    { confidence, timestamp: Date.now() }
  ]);
} else {
  setFaceConfidence(20);
}
  };

  const getAverageMetrics = () => {
    if (expressionSamples.length === 0) {
      return { averageConfidence: 80, eyeContactPercentage: 80, headMovementStability: 80, overallExpressionScore: 80 };
    }
    const avgConfidence = expressionSamples.reduce((sum, s) => sum + s.confidence, 0) / expressionSamples.length;
    const confVal = Math.round(avgConfidence <= 1 ? avgConfidence * 100 : avgConfidence);
    return {
      averageConfidence: Math.min(100, Math.max(0, confVal)),
      eyeContactPercentage: Math.min(100, Math.max(0, Math.round(confVal * 0.9))),
      headMovementStability: Math.min(100, Math.max(0, Math.round(70 + Math.random() * 15))),
      overallExpressionScore: Math.min(100, Math.max(0, confVal))
    };
  };

  const cleanupMedia = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch (e) {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;

    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    if (timerRef.current) clearInterval(timerRef.current);
    if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
  };

  const speakQuestion = (text) => {
    if (!text || !synthRef.current) return;
    try { synthRef.current.cancel(); } catch {}
    setIsSpeaking(true);

    const lang = getLanguage(formData.language);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = lang.speechLocale;

    const voices = synthRef.current.getVoices();
    const localePrefix = lang.speechLocale.split('-')[0];
    const preferredVoice =
      voices.find(v => v.lang === lang.speechLocale && v.name.includes('Google'))
      || voices.find(v => v.lang === lang.speechLocale)
      || voices.find(v => v.lang.startsWith(localePrefix))
      || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => { setIsSpeaking(false); setAmplitude(0); };
    utterance.onerror = () => { setIsSpeaking(false); setAmplitude(0); };

    // Animate the avatar mouth while speaking
    let phase = 0;
    let active = true;
    let raf = 0;
    const loop = () => {
      phase += 0.18;
      const amp = active
        ? Math.max(0, Math.min(1, 0.45 + 0.45 * (Math.sin(phase) * 0.5 + Math.sin(phase * 2.7) * 0.25 + Math.sin(phase * 5.1) * 0.15)))
        : 0;
      setAmplitude(amp);
      if (active) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    utterance.onend = () => {
      active = false;
      setIsSpeaking(false);
      setAmplitude(0);
      cancelAnimationFrame(raf);
    };
    utterance.onerror = () => {
      active = false;
      setIsSpeaking(false);
      setAmplitude(0);
      cancelAnimationFrame(raf);
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  // Initialize A/V check - get camera/mic access before interview
  const initializeAVCheck = async (targetDeviceId = null) => {
    const devId = targetDeviceId || selectedVideoDeviceId;
    setError('');

    // Stop previous check stream if any
    if (avCheckStream) {
      try {
        avCheckStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      setAvCheckStream(null);
    }

    try {
      const videoConstraints = devId
        ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      });
      setAvCheckStream(stream);
      setAvVideoWorking(true);
      setAvAudioWorking(true);

      // Connect to video element
      if (avVideoRef.current) {
        avVideoRef.current.srcObject = stream;
      }

      // Update available devices with actual labels
      if (navigator.mediaDevices?.enumerateDevices) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devs.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vDevs);
        const activeTrack = stream.getVideoTracks()[0];
        if (activeTrack) {
          const settings = activeTrack.getSettings();
          if (settings.deviceId && !selectedVideoDeviceId && !targetDeviceId) {
            setSelectedVideoDeviceId(settings.deviceId);
          }
        }
      }

      return true;
    } catch (err) {
      console.warn('A/V specific check failed, trying loose constraints:', err.message);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setAvCheckStream(stream);
        setAvVideoWorking(true);
        setAvAudioWorking(true);
        if (avVideoRef.current) avVideoRef.current.srcObject = stream;
        return true;
      } catch (e2) {}

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAvCheckStream(audioStream);
        setAvAudioWorking(true);
        setAvVideoWorking(false);
        setError('Camera blocked or unavailable. Microphone connected — you can proceed in audio mode.');
        return true;
      } catch (audioErr) {
        console.warn('Audio check also failed:', audioErr.message);
      }
      setAvVideoWorking(false);
      setAvAudioWorking(false);
      setError('Could not access camera/microphone. Please click "Start Interview (Continue Anyway)" below or unblock in browser.');
      return false;
    }
  };

  // Extract text from PDF file using backend API
  const extractTextFromPDF = async (file) => {
    try {
      setResumeLoading(true);
      setResumeError('');

      // Use backend API to extract text from PDF
      const response = await uploadApi.extractText(file);
      // Backend returns { success: true, data: { text: ..., pageCount: ... } }
      const extractedText = response.data?.text || response.text || '';

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Could not extract text from PDF. The file may be image-based or corrupted.');
      }

      setResumeText(extractedText.trim());
      setResumeFile(file);
      setResumeLoading(false);
      return extractedText.trim();
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setResumeError(err.message || 'Failed to extract text from PDF. Please try a different file.');
      setResumeLoading(false);
      return '';
    }
  };

  const handleResumeSelect = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    if (id === 'none') {
      setResumeText('');
      setResumeFile(null);
    } else if (id === 'upload') {
      setResumeText('');
      setResumeFile(null);
    } else {
      const selected = savedResumes.find(r => (r._id || r.id) === id);
      if (selected) {
        setResumeText(selected.enhancedText || selected.originalText || '');
        setResumeFile({ name: selected.title || selected.jobRole || 'Saved Resume' });
      }
    }
  };

  // Handle resume file selection
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setResumeError('File size must be less than 5MB');
      return;
    }

    await extractTextFromPDF(file);
  };

  // Remove uploaded resume
  const removeResume = () => {
    setSelectedResumeId('none');
    setResumeFile(null);
    setResumeText('');
    setResumeError('');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
  };

  // Confirm A/V is working and start the actual interview (or continue anyway)
  const confirmAVAndStart = (bypass = false) => {
    // Stop the AV check stream - it will be re-initialized in interview step
    if (avCheckStream) {
      try {
        avCheckStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      setAvCheckStream(null);
    }

    if (bypass || !avVideoWorking) {
      setVideoEnabled(false);
    }

    setAvConfirmed(true);
    setStep('interview');
  };

  const handleStartInterview = async (e) => {
    e?.preventDefault?.();
    if (!formData.jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Resume text + JD text are both included for personalized questions
      const response = await interviewApi.startInterview({
        ...formData,
        resumeText: resumeText || null,
        jobDescriptionText: jdSummary?.jdText || null,
        companyName: formData.companyName || null,
        companyRole: formData.companyName ? formData.jobRole : null,
        skipWarmup: formData.skipWarmup || warmupQuestions.length > 0
      });
      setInterviewId(response.data.interviewId);
      setQuestions(response.data.questions);
      setCodingQuestion(response.data.codingQuestion || null);
      setCode(response.data.codingQuestion?.starterCode || '');
      setAnswersSubmitted([]);

      // Route: warmup → av-check → interview → feedback
      if (!formData.skipWarmup) {
        try {
          const wr = await interviewApi.getWarmupQuestions({
            jobRole: formData.jobRole,
            industry: formData.industry,
            language: formData.language
          });
          setWarmupQuestions(wr.data?.questions || []);
          setWarmupIndex(0);
          setStep('warmup');
        } catch (e) {
          console.warn('Warmup fetch failed, skipping:', e.message);
          setStep('av-check');
          await initializeAVCheck();
        }
      } else {
        setStep('av-check');
        await initializeAVCheck();
      }
    } catch (err) {
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const completeWarmup = async () => {
    setStep('av-check');
    await initializeAVCheck();
  };

  const switchProvider = async () => {
    if (!interviewId) return;
    setSwitchBusy(true);
    setError('');
    try {
      const res = await interviewApi.switchProvider(interviewId);
      if (res?.data?.analysis) {
        // Update the last answer's analysis in-place
        setAnswersSubmitted((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, analysis: res.data.analysis }];
        });
      }
      setShowSwitchProvider(false);
    } catch (err) {
      setError(err.message || 'Failed to switch provider');
    } finally {
      setSwitchBusy(false);
    }
  };

  const runCandidateCode = async () => {
    if (!interviewId || !code?.trim()) return;
    setIsRunningCode(true);
    setRunResults(null);
    try {
      const res = await interviewApi.runCode(interviewId, {
        code,
        language: formData.codingLanguage,
        problemId: codingQuestion?.questionId || questions[0]?.questionId
      });
      setRunResults(res.data);
    } catch (err) {
      setError(err.message || 'Failed to evaluate code');
    } finally {
      setIsRunningCode(false);
    }
  };

  const parseJd = async () => {
    if (!jdInput.trim()) return;
    setJdLoading(true);
    setJdError('');
    try {
      const payload = jdMode === 'url' ? { url: jdInput.trim() } : { text: jdInput.trim() };
      const res = await interviewApi.parseJd(payload);
      setJdSummary(res.data);
      if (res.data?.role && !formData.jobRole) {
        setFormData((f) => ({ ...f, jobRole: res.data.role }));
      }
    } catch (err) {
      setJdError(err.message || 'Failed to parse job description');
    } finally {
      setJdLoading(false);
    }
  };

  const generateShareImage = async () => {
    if (!shareCardRef.current || !overallResults) return null;
    setShareBusy(true);
    try {
      const blob = await captureCardToBlob(shareCardRef.current);
      return blob;
    } finally {
      setShareBusy(false);
    }
  };

  const handleShare = async () => {
    const blob = await generateShareImage();
    if (!blob) return;
    const caption = buildShareCaption(overallResults);
    const result = await shareImage({ blob, text: caption, fileName: `careerpilot-${overallResults.interviewId || 'score'}.png` });
    if (result.method === 'native' || result.method === 'cancelled') return;
  };

  const handleDownloadShare = async () => {
    const blob = await generateShareImage();
    if (!blob) return;
    downloadBlob(blob, `careerpilot-${overallResults?.interviewId || 'score'}.png`);
  };

  const startVisualizerDraw = (analyser, canvas) => {
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      if (!isRecordingRef.current) return;
      animationFrameIdRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);
      
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.lineWidth = 2.5;
      
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ec4899');
      ctx.strokeStyle = gradient;
      
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
      
      ctx.beginPath();
      
      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    
    draw();
  };

  const startRecording = () => {
    if (!audioEnabled) {
      setError('Please enable microphone to record your answer');
      return;
    }

    const SpeechRec = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRec) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isSpeaking) stopSpeaking();

    setTranscript('');
    transcriptRef.current = '';
    setRecordingTime(0);
    startTimeRef.current = Date.now();
    setExpressionSamples([]);
    setError('');
    isRecordingRef.current = true;
    setIsRecording(true);

    // Initialize Audio Visualizer
    try {
      if (mediaStreamRef.current) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        
        source.connect(analyser);
        
        // Start drawing loop after small timeout to allow canvas mount
        setTimeout(() => {
          if (visualizerCanvasRef.current) {
            startVisualizerDraw(analyser, visualizerCanvasRef.current);
          }
        }, 100);
      }
    } catch (visErr) {
      console.error('Failed to initialize audio visualizer:', visErr);
    }

    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Also record audio via MediaRecorder so we can upload the answer audio for replay.
    try {
      if (mediaStreamRef.current && typeof MediaRecorder !== 'undefined') {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
        const recorder = mimeType ? new MediaRecorder(mediaStreamRef.current, { mimeType }) : new MediaRecorder(mediaStreamRef.current);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }
    } catch (e) {
      console.warn('MediaRecorder unavailable:', e.message);
    }

    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      transcriptRef.current = finalTranscript;
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      if (isRecordingRef.current && (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted')) {
        setTimeout(() => { try { recognition.start(); } catch (e) { } }, 100);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        setTimeout(() => { try { recognition.start(); } catch (e) { } }, 100);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    
    // Stop audio visualizer
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch (e) {
        console.error('Error closing AudioContext:', e);
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;

    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    recognitionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop MediaRecorder and collect audio blob
    let audioBlob = null;
    if (mediaRecorderRef.current) {
      try {
        const recorder = mediaRecorderRef.current;
        if (recorder.state !== 'inactive') {
          await new Promise((resolve) => {
            recorder.onstop = resolve;
            try { recorder.stop(); } catch (_) { resolve(); }
          });
        }
        if (audioChunksRef.current.length > 0) {
          audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        }
      } catch (e) {
        console.warn('MediaRecorder stop failed:', e.message);
      }
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    // eslint-disable-next-line
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const metrics = getAverageMetrics();

    const finalTranscript = transcriptRef.current.trim() || transcript.trim();

    // Prioritize Whisper Small ASR transcription when audioBlob is present
    let resolvedTranscript = finalTranscript;
    if (audioBlob && whisperState?.enabled) {
      try {
        const wt = await whisperManager.transcribe(audioBlob, formData.language);
        if (wt && wt.trim()) {
          resolvedTranscript = wt.trim();
          setTranscript(resolvedTranscript);
        }
      } catch (e) {
        console.warn('Whisper Small transcription fallback:', e.message);
      }
    }

    // Secondary fallback to backend cloud transcription if not resolved
    if (!resolvedTranscript && audioBlob) {
      try {
        const tr = await interviewApi.transcribe({ audioBlob, language: formData.language });
        resolvedTranscript = (tr?.data?.text || '').trim();
        if (resolvedTranscript) setTranscript(resolvedTranscript);
      } catch (e) {
        console.warn('Backend transcription failed:', e.message);
      }
    }

    if (!resolvedTranscript) {
      setError('No speech recorded. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await interviewApi.submitAnswer(interviewId, {
        questionId: questions[currentQuestionIndex].questionId,
        transcript: resolvedTranscript,
        duration,
        expressionMetrics: metrics,
        code: formData.mode === 'coding' ? code : undefined,
        codingLanguage: formData.mode === 'coding' ? formData.codingLanguage : undefined,
        audioBlob
      });

      setAnswersSubmitted([...answersSubmitted, { questionIndex: currentQuestionIndex, transcript: resolvedTranscript, analysis: response.data.analysis }]);

      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      }

      if (response.data?.answeredCount >= response.data?.totalQuestions || !response.data?.nextQuestion) {
        completeInterview();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setTranscript('');
        setCode(response.data?.codingQuestion?.starterCode || code);
        setRunResults(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const submitTextAnswer = async () => {
    const finalTranscript = textAnswer.trim();
    if (!finalTranscript) {
      setError('Please type your answer before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await interviewApi.submitAnswer(interviewId, {
        questionId: questions[currentQuestionIndex].questionId,
        transcript: finalTranscript,
        duration: 30, // Default for text answers
        expressionMetrics: { averageConfidence: 0.8, eyeContactPercentage: 80, headMovementStability: 0.8, overallExpressionScore: 80 }
      });

      setAnswersSubmitted([...answersSubmitted, { questionIndex: currentQuestionIndex, transcript: finalTranscript }]);

      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      }

      if (response.data?.answeredCount >= response.data?.totalQuestions || !response.data?.nextQuestion) {
        completeInterview();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setTextAnswer('');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };


 const completeInterview = async () => {
  setLoading(true);
  try {
    const response = await interviewApi.completeInterview(interviewId);
    const score = response.data.overallScore;
    const previousLevel = progressData.level;
    const updatedProgress = updateDifficulty(score,progressData);
    localStorage.setItem("interviewProgress",JSON.stringify( updatedProgress));
    setProgressData(updatedProgress);
    if(
 previousLevel !==
 updatedProgress.level
){
 alert(
   `🎉 Congratulations!
You reached
${updatedProgress.level}`
 );
}

    setOverallResults(response.data);
    setStep('feedback');

    triggerConfetti({
      duration: 3500,
      particleCount: 180,
      spread: 130
    });

    cleanupMedia();

  } catch (err) {
    setError(err.message || 'Failed to complete interview');
  } finally {
    setLoading(false);
  }
};
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const replayQuestion = () => {
    if (questions[currentQuestionIndex]) speakQuestion(questions[currentQuestionIndex].question);
  };

  const resetInterview = () => {
    setStep('setup');
    setInterviewId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setOverallResults(null);
    setTranscript('');
    setExpressionSamples([]);
    setAnswersSubmitted([]);
  };

  // Mobile devices are now supported. We auto-route to text-input mode so
  // users without a desktop mic can still complete the interview via typing.
  // The A/V check still works on mobile (front-facing camera + mic), but the
  // voice capture path gracefully falls back to text.

  // A/V Check step - confirm camera and microphone before interview (Full 2-Column One Section)
  if (step === 'av-check') {
    return (
      <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#76b900] selection:text-black py-8 md:py-10">
        {/* Subtle grid background */}
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1a1a1a 1px, transparent 1px),
              linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 xl:px-20">
          {/* Header (Removed Equipment Check Required line) */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2.5 h-2.5 bg-[#76b900]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#76b900]">
                MODULE 02 // HARDWARE CALIBRATION
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-mono">
              CONFIRM YOUR SETUP
            </h1>
            <p className="mt-2.5 text-zinc-400 text-sm md:text-base font-mono max-w-3xl leading-relaxed">
              Verify your camera feed and acoustic input are calibrated before initiating the live assessment.
            </p>
          </div>

          {/* Compatibility Alerts */}
          {isMobile && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 font-mono text-xs text-blue-300 flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Mobile device detected — text-answer mode is available if voice input is hindered.</span>
            </div>
          )}

          {!isChrome && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 font-mono text-xs text-amber-300 flex items-center gap-3">
              <Chrome className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Google Chrome recommended for optimal speech recognition and low-latency audio capture.</span>
            </div>
          )}

          {/* Main 2-Column One Section Container */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/40 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Column 1: Video Feed & Sensor Diagnostics */}
              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08] mb-5">
                    <Video className="w-4 h-4 text-[#76b900]" />
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-200">
                      OPTICAL FEED & ACOUSTIC SENSORS
                    </h2>
                  </div>

                  {/* Video Viewport */}
                  <div className="relative aspect-video rounded-xl bg-black border border-white/10 overflow-hidden mb-5">
                    <video
                      ref={avVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {avVideoWorking ? (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-mono font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>LIVE STREAM • 1080P</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                        <div className="text-center p-4">
                          <VideoOff className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                          <p className="font-mono text-xs text-zinc-400">Camera feed not detected</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Device Selector */}
                  {videoDevices.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
                      <span className="text-[#76b900] font-bold shrink-0">SELECT CAMERA:</span>
                      <select
                        value={selectedVideoDeviceId}
                        onChange={(e) => {
                          setSelectedVideoDeviceId(e.target.value);
                          initializeAVCheck(e.target.value);
                        }}
                        className="flex-1 bg-[#141518] text-white border border-white/20 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#76b900] cursor-pointer"
                      >
                        {videoDevices.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || (d.deviceId ? `Camera ${i + 1} (${d.deviceId.slice(0, 8)}...)` : `Camera ${i + 1}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Device Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border font-mono transition-all ${
                      avVideoWorking
                        ? 'bg-[#76b900]/10 border-[#76b900]/30 text-white'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      <div className="flex items-center gap-3">
                        {avVideoWorking ? (
                          <CheckCircle2 className="w-5 h-5 text-[#76b900] shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">
                            Camera
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {avVideoWorking ? 'Working // Stream Active' : 'Not Detected'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border font-mono transition-all ${
                      avAudioWorking
                        ? 'bg-[#76b900]/10 border-[#76b900]/30 text-white'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      <div className="flex items-center gap-3">
                        {avAudioWorking ? (
                          <CheckCircle2 className="w-5 h-5 text-[#76b900] shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">
                            Microphone
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {avAudioWorking ? 'Working // Audio Calibrated' : 'Not Detected'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="font-mono text-xs text-red-400">
                          <p className="font-bold">{error}</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            In Brave, click the <span className="text-white font-bold">🔒 / ⚙️ tune icon</span> next to <span className="text-white">localhost:5173</span> in the address bar and switch Camera & Microphone to <span className="text-[#76b900] font-bold">Allow</span>.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setError('');
                            initializeAVCheck();
                          }}
                          className="px-3 py-2 rounded-lg bg-[#76b900] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#86d100] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request / Retry Access</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmAVAndStart(true)}
                          className="px-3 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Continue Anyway (Audio / Text Mode)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      if (avCheckStream) {
                        avCheckStream.getTracks().forEach(track => track.stop());
                        setAvCheckStream(null);
                      }
                      setStep('setup');
                    }}
                    className="w-full sm:w-1/3 py-3.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Back to Setup
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAVAndStart(!avVideoWorking || !avAudioWorking)}
                    className="w-full sm:w-2/3 py-3.5 px-6 rounded-xl bg-[#76b900] hover:bg-[#86d100] active:scale-[0.99] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center shadow-none flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{avVideoWorking && avAudioWorking ? 'Confirm & Start Interview' : 'Start Interview (Continue Anyway)'}</span>
                  </button>
                </div>
              </div>

              {/* Column 2: Interview Protocol & Do's and Don'ts */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                  <ShieldCheck className="w-4 h-4 text-[#76b900]" />
                  <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-200">
                    ASSESSMENT PROTOCOL & DO'S AND DON'TS
                  </h2>
                </div>

                {/* DO's Card */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-[#76b900]/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#76b900]" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#76b900]">
                      DO'S // RECOMMENDED CANDIDATE PROTOCOLS
                    </h3>
                  </div>
                  <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#76b900] font-bold mt-0.5">✓</span>
                      <span>Look directly at your camera lens during answers to project confidence.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#76b900] font-bold mt-0.5">✓</span>
                      <span>Structure technical answers using STAR (Situation, Task, Action, Result).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#76b900] font-bold mt-0.5">✓</span>
                      <span>Quantify engineering outcomes (e.g. p99 latency reduction %, QPS scale, cloud cost).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-[#76b900] font-bold mt-0.5">✓</span>
                      <span>Vocalize architectural tradeoffs—explain why you chose specific data structures or engines.</span>
                    </li>
                  </ul>
                </div>

                {/* DON'Ts Card */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                      DON'TS // ASSESSMENT RESTRICTIONS
                    </h3>
                  </div>
                  <ul className="space-y-2.5 font-mono text-xs text-zinc-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold mt-0.5">✕</span>
                      <span>Do not switch browser tabs or minimize the assessment window.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold mt-0.5">✕</span>
                      <span>Do not consult external notes or generative AI tools during live questioning.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold mt-0.5">✕</span>
                      <span>Avoid brief or one-word answers; elaborate with technical depth and rationale.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold mt-0.5">✕</span>
                      <span>Do not jump into coding or design before clarifying functional requirements.</span>
                    </li>
                  </ul>
                </div>

                {/* Environmental Check */}
                <div className="p-4 rounded-xl bg-[#141418]/60 border border-white/[0.06] flex items-center gap-3">
                  <Lightbulb className="w-4 h-4 text-[#76b900] shrink-0" />
                  <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">
                    A well-lit, quiet environment ensures accurate facial expression parsing and clear speech-to-text transcription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#76b900] selection:text-black py-8 md:py-10">
        {/* Subtle grid background */}
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1a1a1a 1px, transparent 1px),
              linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 xl:px-20">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-2.5 h-2.5 bg-[#76b900]" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#76b900]">
                MODULE 02 // TECHNICAL EVALUATION
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-mono">
              AI TECHNICAL INTERVIEW & LIVE SCREEN
            </h1>
            <p className="mt-2.5 text-zinc-400 text-sm md:text-base font-mono max-w-3xl leading-relaxed">
              Autonomous evaluation engine powered by NVIDIA Nemotron 120B. Calibrates domain depth, system architecture tradeoffs, and communication rubrics in real-time.
            </p>
          </div>

          {/* Main Single Section: Double Column Structure */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/40 to-transparent pointer-events-none" />

            <form onSubmit={handleStartInterview} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Column 1: Target Calibration & Track */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                    <Terminal className="w-4 h-4 text-[#76b900]" />
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-200">
                      01 // ROLE CALIBRATION & TRACK
                    </h2>
                  </div>

                  {/* Target Job Role */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Target Engineering Role *
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">
                        Calibrates Probing Questions
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.jobRole}
                      onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                      placeholder="e.g. Senior Backend Engineer, Distributed Systems"
                      className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] transition-all"
                      required
                    />

                    {/* Suggestions */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        SUGGESTIONS:
                      </span>
                      {SUGGESTED_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({ ...formData, jobRole: role })}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#76b900]/40 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industry & Experience Level Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Industry Track *
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-3 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] transition-all"
                      >
                        {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value} className="bg-[#0c0c0f]">{ind.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Seniority Level *
                      </label>
                      <select
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-3 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] transition-all"
                      >
                        {EXPERIENCE_LEVELS.map(level => <option key={level.value} value={level.value} className="bg-[#0c0c0f]">{level.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Interview Mode Cards (2x2 Grid) */}
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2.5">
                      Interview Assessment Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {INTERVIEW_MODES.map((m) => {
                        const isSelected = formData.mode === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, mode: m.value })}
                            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#76b900]/10 border-[#76b900] text-white shadow-[0_0_15px_rgba(118,185,0,0.15)]'
                                : 'bg-black/40 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-[#76b900]' : 'text-white'}`}>
                                {m.label}
                              </span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#76b900]" />}
                            </div>
                            <p className="font-mono text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              {m.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coding Language (if coding mode) */}
                  {formData.mode === 'coding' && (
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Coding Execution Language
                      </label>
                      <select
                        value={formData.codingLanguage}
                        onChange={(e) => setFormData({ ...formData, codingLanguage: e.target.value })}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-3 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]"
                      >
                        {CODING_LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value} className="bg-[#0c0c0f]">{l.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Language & Target Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#76b900]" /> Spoken Language
                        </span>
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-3 text-sm font-mono text-zinc-200 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]"
                      >
                        {SUPPORTED_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code} className="bg-[#0c0c0f]">{l.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Target Company <span className="text-zinc-500 lowercase">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Google, NVIDIA, Stripe"
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Context & Assessment Criteria */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                    <BarChart3 className="w-4 h-4 text-[#76b900]" />
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-200">
                      02 // CONTEXT & ASSESSMENT CRITERIA
                    </h2>
                  </div>

                  {/* Question Count Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Assessment Length
                      </label>
                      <span className="font-mono text-xs font-bold text-[#76b900] px-2 py-0.5 rounded bg-[#76b900]/10 border border-[#76b900]/30">
                        {formData.questionCount} Questions
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={formData.questionCount}
                        onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#76b900]"
                      />
                    </div>
                    <p className="font-mono text-[11px] text-zinc-500 mt-2">
                      Select 2 to 20 questions. Standard engineering screening is 8–10 questions (~15–20 minutes).
                    </p>
                  </div>

                  {/* Job Description (Optional) */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-[#76b900]" />
                        Job Description Target <span className="text-zinc-500 lowercase">(optional)</span>
                      </label>
                      {jdSummary && (
                        <button
                          type="button"
                          onClick={() => { setJdSummary(null); setJdInput(''); }}
                          className="font-mono text-[10px] text-zinc-400 hover:text-white uppercase cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {!jdSummary && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          {['none', 'paste', 'url'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setJdMode(m)}
                              className={`px-3 py-1 font-mono text-[11px] rounded-lg border transition-colors cursor-pointer ${
                                jdMode === m
                                  ? 'bg-[#76b900]/15 border-[#76b900]/50 text-[#76b900]'
                                  : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {m === 'none' ? 'Skip' : m === 'paste' ? 'Paste Text' : 'From URL'}
                            </button>
                          ))}
                        </div>

                        {jdMode !== 'none' && (
                          <div className="space-y-2">
                            <textarea
                              value={jdInput}
                              onChange={(e) => setJdInput(e.target.value)}
                              placeholder={jdMode === 'url' ? 'https://careers.google.com/jobs/results/...' : 'Paste target job description requirements...'}
                              rows={jdMode === 'url' ? 2 : 4}
                              className="w-full rounded-xl border border-white/[0.08] bg-black/60 p-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#76b900]"
                            />
                            {jdError && <p className="font-mono text-xs text-red-400">{jdError}</p>}
                            <button
                              type="button"
                              onClick={parseJd}
                              disabled={jdLoading || !jdInput.trim()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase font-bold rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white disabled:opacity-50 cursor-pointer"
                            >
                              {jdLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                              {jdLoading ? 'Extracting…' : 'Extract Requirements'}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {jdSummary && (
                      <div className="font-mono text-xs text-[#76b900] space-y-1 p-2 rounded bg-[#76b900]/10 border border-[#76b900]/20">
                        <div><span className="text-zinc-400">DETECTED ROLE: </span>{jdSummary.role || '—'}</div>
                        {jdSummary.company && <div><span className="text-zinc-400">COMPANY: </span>{jdSummary.company}</div>}
                        <div><span className="text-zinc-400">LENGTH: </span>{jdSummary.jdText.length.toLocaleString()} characters</div>
                      </div>
                    )}
                  </div>

                  {/* Resume Context (Optional) */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-2">
                      <FileUp className="w-3.5 h-3.5 text-[#76b900]" />
                      Candidate Resume Context <span className="text-zinc-500 lowercase">(optional)</span>
                    </label>

                    <div className="space-y-3">
                      <select
                        value={selectedResumeId}
                        onChange={handleResumeSelect}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#76b900]"
                      >
                        <option value="none" className="bg-[#0c0c0f]">-- No Resume Attached --</option>
                        {savedResumes.map(r => (
                          <option key={r._id || r.id} value={r._id || r.id} className="bg-[#0c0c0f]">
                            {r.title || r.jobRole || 'Saved Resume'}
                          </option>
                        ))}
                        <option value="upload" className="bg-[#0c0c0f]">+ Upload New PDF</option>
                      </select>

                      {selectedResumeId === 'upload' && !resumeFile && (
                        <div className="relative cursor-pointer">
                          <input
                            ref={resumeInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={resumeLoading}
                          />
                          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/40 border border-dashed border-white/20 hover:border-[#76b900]/50 transition-colors cursor-pointer">
                            {resumeLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 text-[#76b900] animate-spin" />
                                <span className="font-mono text-xs text-zinc-400">Extracting PDF text...</span>
                              </>
                            ) : (
                              <>
                                <FileUp className="w-4 h-4 text-zinc-400" />
                                <span className="font-mono text-xs text-zinc-400">Click to attach PDF resume</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {resumeFile && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#76b900]/10 border border-[#76b900]/30">
                          <div className="flex items-center gap-2 text-xs font-mono text-[#76b900] truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{resumeFile.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeResume}
                            className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {resumeError && (
                        <p className="font-mono text-xs text-red-400">{resumeError}</p>
                      )}

                      {resumeText && (
                        <p className="font-mono text-[11px] text-[#76b900] flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Questions will dynamically reflect your architectural experience
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Engine Protocol Banner */}
                  <div className="p-3.5 rounded-xl bg-[#141418]/70 border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-pulse" />
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                        NVIDIA NEMOTRON 120B ENGINE READY
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">
                      Questions are generated dynamically. Answers are evaluated across technical accuracy, depth, STAR structure, and communication clarity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="font-mono text-xs text-zinc-400">
                  TRACK: <span className="text-white font-bold">{formData.jobRole || 'SOFTWARE ENGINEERING'}</span> • MODE: <span className="text-[#76b900] font-bold">{formData.mode.toUpperCase()}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.jobRole.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-xl bg-[#76b900] hover:bg-[#86d100] active:scale-[0.99] disabled:bg-[#141414] disabled:text-zinc-600 disabled:border disabled:border-white/[0.05] disabled:cursor-not-allowed text-black font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-none"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  <span>{loading ? 'Generating Assessment...' : `Initialize Interview (${formData.questionCount} Questions)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Warmup / Start Test Protocol Popup ──────────────────────────────────────────
  if (step === 'warmup' && warmupQuestions.length > 0) {
    const wq = warmupQuestions[warmupIndex];
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4 sm:p-6 relative selection:bg-[#76b900] selection:text-black">
        {/* Subtle background grid */}
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1a1a1a 1px, transparent 1px),
              linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl rounded-2xl bg-[#0c0c0f]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Top Hairline Green Progress Bar */}
          <div className="w-full h-1 bg-[#76b900]" />

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#76b900]" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#76b900]">
                  TEST BRIEFING // NEMOTRON 120B
                </span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400">
                PROMPT {warmupIndex + 1} OF {warmupQuestions.length}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-mono mb-2">
                START TEST PROTOCOL
              </h2>
              <p className="font-mono text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Your technical session for <span className="text-white font-bold">{formData.jobRole || "Software Engineer"}</span> is generated and ready for execution.
              </p>
            </div>

            {/* Introductory Calibration Prompt */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#76b900]" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                  INTRODUCTORY CALIBRATION PROMPT
                </span>
              </div>
              <p className="font-mono text-sm text-zinc-200 leading-relaxed font-medium">
                "{wq?.question}"
              </p>
              <p className="font-mono text-[11px] text-zinc-500 pt-1">
                * This introductory response calibrates your acoustic microphone levels and does not penalize your scored readiness benchmark.
              </p>
            </div>

            {/* Mode Confirmation Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 uppercase block">Track</span>
                <span className="text-white font-bold uppercase truncate block">{formData.mode}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 uppercase block">Questions</span>
                <span className="text-[#76b900] font-bold">{formData.questionCount} Questions</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] col-span-2 sm:col-span-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Engine</span>
                <span className="text-white font-bold">Nemotron 120B</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={completeWarmup}
                className="px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Skip Warmup
              </button>
              <button
                type="button"
                onClick={completeWarmup}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#76b900] hover:bg-[#86d100] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-none"
              >
                <span>{warmupIndex + 1 >= warmupQuestions.length ? 'Start Test' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'interview') {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / formData.questionCount) * 100;
    const isCoding = formData.mode === 'coding';

    return (
      <>
        <div className="min-h-screen bg-[#0f1013] text-zinc-100 flex flex-col justify-between select-none relative overflow-x-hidden font-sans pb-24">
          {/* Subtle Ambient Studio Background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#76b900]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          {/* Google Meet Top Navigation Bar */}
          <header className="sticky top-0 z-30 bg-[#17181c]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              {/* Left: Meeting Info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="w-2 h-2 rounded-full bg-[#76b900] animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    xInterview Live
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                  <span>Room:</span>
                  <span className="text-zinc-200">xint-nemotron-{currentQuestionIndex + 1}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] text-zinc-300 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatTime(meetingTimer)}</span>
                </div>
              </div>

              {/* Center: Question Progress */}
              <div className="flex flex-col items-center max-w-xs w-full">
                <div className="flex items-center justify-between w-full text-xs font-mono text-zinc-400 mb-1">
                  <span>Question {currentQuestionIndex + 1} of {formData.questionCount}</span>
                  <span className="text-[#76b900] font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-[#76b900] to-emerald-400"
                  />
                </div>
              </div>

              {/* Right: Whisper Mode Badge & Switch AI */}
              <div className="flex items-center gap-2.5">
                {/* Whisper Small 244M Mode Pill */}
                <button
                  onClick={() => {
                    if (whisperState.status === 'idle') {
                      whisperManager.loadModel();
                    } else {
                      whisperManager.setEnabled(!whisperState.enabled);
                    }
                  }}
                  title="Whisper Small (244M params • ~3.3x Base size) Speech-to-Text Model"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                    whisperState.enabled
                      ? 'bg-[#76b900]/10 border-[#76b900]/40 text-[#76b900]'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${whisperState.enabled ? 'animate-pulse text-[#76b900]' : ''}`} />
                  <span className="hidden md:inline font-semibold">Whisper Small (244M)</span>
                  <span className="md:hidden font-semibold">Whisper</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    whisperState.status === 'downloading'
                      ? 'bg-amber-400 animate-ping'
                      : whisperState.enabled
                      ? 'bg-[#76b900]'
                      : 'bg-zinc-500'
                  }`} />
                  {whisperState.status === 'downloading' && (
                    <span className="text-[10px] text-amber-300">{whisperState.progress}%</span>
                  )}
                </button>

                <button
                  onClick={() => setShowSwitchProvider(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white hover:border-[#76b900]/40 transition-colors"
                  title="Switch AI Provider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#76b900]" />
                  <span>Switch AI</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Google Meet Video Stage */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
            {isCoding ? (
              /* Coding Split Layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c0d10] shadow-xl">
                    <AvatarInterviewer isSpeaking={isSpeaking} amplitude={amplitude} />
                  </div>
                  <Suspense fallback={<div className="h-40 flex items-center justify-center text-zinc-500">Loading problem…</div>}>
                    <CodingQuestionCard
                      coding={codingQuestion || questions[0]?.coding}
                      runResults={runResults}
                    />
                  </Suspense>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#16171b] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase font-mono tracking-wide text-zinc-400">
                        Solution ({formData.codingLanguage})
                      </span>
                      <Button
                        onClick={runCandidateCode}
                        disabled={isRunningCode || !code?.trim()}
                        variant="outline"
                        className="!py-2 !px-3 !text-xs font-mono"
                      >
                        {isRunningCode ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                        {isRunningCode ? 'Evaluating…' : 'Run Tests'}
                      </Button>
                    </div>
                    <Suspense fallback={<div className="h-48 flex items-center justify-center text-zinc-500 text-sm">Loading editor…</div>}>
                      <CodeEditor
                        language={formData.codingLanguage}
                        value={code}
                        onChange={setCode}
                        height="320px"
                      />
                    </Suspense>
                  </div>
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Explain your approach (evaluated alongside code)…"
                    rows={2}
                    className="w-full p-3 rounded-xl bg-[#16171b] border border-white/10 text-sm text-zinc-200 focus:ring-1 focus:ring-[#76b900] resize-y"
                  />
                </div>
              </div>
            ) : (
              /* Google Meet Dual-Tile Stage (Interviewer & Candidate) */
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1 items-stretch">
                  {/* Tile 1: AI Technical Interviewer (inteview_image.png) */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c0d10] shadow-2xl flex items-center justify-center">
                    <AvatarInterviewer isSpeaking={isSpeaking} amplitude={amplitude} />
                  </div>

                  {/* Tile 2: Candidate Video Feed (Google Meet Style) */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c0d10] shadow-2xl flex items-center justify-center group">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Camera Off Placeholder */}
                    {!videoEnabled && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131417]">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center mb-3 shadow-inner">
                          <span className="font-mono text-2xl font-bold text-zinc-300">YOU</span>
                        </div>
                        <p className="font-mono text-xs text-zinc-400">Camera is turned off</p>
                      </div>
                    )}

                    {/* Top Right: Recording Indicator */}
                    {isRecording && (
                      <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-red-600/90 backdrop-blur-md text-white rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span className="font-mono text-xs font-bold tracking-wider">
                          REC {formatTime(recordingTime)}
                        </span>
                      </div>
                    )}

                    {/* Bottom Left: Google Meet Candidate Name Badge */}
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        You (Candidate)
                      </span>
                      {audioEnabled ? (
                        <Mic className="w-3.5 h-3.5 text-[#76b900]" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>

                    {/* Bottom Right: Face Tracking / Confidence Tag */}
                    <div className="absolute bottom-4 right-4 z-20 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-1.5 font-mono text-[10px] text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${faceVisible ? 'bg-[#76b900]' : 'bg-red-400'}`} />
                      <span>{Math.round(faceConfidence)}% PRESENCE</span>
                    </div>

                    {/* Face Warning Alert Overlay */}
                    {isRecording && !faceVisible && (
                      <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                        <UserX className="w-14 h-14 text-red-400 mb-2 animate-bounce" />
                        <h4 className="text-white font-bold text-base">Face Not In Camera Frame</h4>
                        <p className="text-red-300 text-xs mt-1 max-w-xs">
                          Please re-center yourself directly in front of the lens for proctoring.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Meet Captions / Current Question Banner */}
                <div className="w-full rounded-2xl bg-[#16171b]/90 backdrop-blur-xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-md bg-[#76b900]/10 border border-[#76b900]/30 font-mono text-xs font-bold text-[#76b900] uppercase tracking-wider">
                        Question #{currentQuestionIndex + 1}
                      </span>
                      <span className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
                        {currentQuestion?.type || 'Technical'} • {currentQuestion?.difficulty || 'Medium'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSpeaking ? (
                        <button
                          onClick={stopSpeaking}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors font-mono text-xs cursor-pointer"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Mute Question</span>
                        </button>
                      ) : (
                        <button
                          onClick={replayQuestion}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-colors font-mono text-xs cursor-pointer"
                          title="Replay interviewer's voice"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#76b900]" />
                          <span>Replay Audio</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                    {currentQuestion?.question}
                  </h3>

                  {/* Live Captioning & Audio Wave during Recording */}
                  {isRecording && (
                    <div className="p-4 rounded-xl bg-black/40 border border-[#76b900]/20 space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="flex items-center gap-2 text-[#76b900]">
                          <span className="w-2 h-2 rounded-full bg-[#76b900] animate-ping" />
                          <span>Transcribing via {whisperState.modelLabel}</span>
                        </span>
                        <span className="text-zinc-400">REC {formatTime(recordingTime)}</span>
                      </div>

                      {/* Visualizer canvas */}
                      <div className="h-12 w-full rounded-lg overflow-hidden bg-black/60 border border-white/5">
                        <canvas ref={visualizerCanvasRef} className="w-full h-full" />
                      </div>

                      {/* Live transcription preview */}
                      <div className="text-sm font-sans text-zinc-200 bg-white/[0.02] p-3 rounded-lg border border-white/[0.05] italic">
                        {transcript || 'Listening to your response... speak clearly into your microphone.'}
                      </div>
                    </div>
                  )}

                  {/* Text Input Option */}
                  {useTextInput && (
                    <div className="space-y-3 pt-2">
                      <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your technical response here..."
                        rows={3}
                        className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-zinc-200 placeholder-zinc-500 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-[#76b900]"
                        disabled={loading}
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Google Meet Bottom Floating Control Dock */}
          <footer className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[96vw]">
            <div className="bg-[#1c1d22]/90 backdrop-blur-2xl border border-white/10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.75)] flex items-center gap-2.5 sm:gap-4">
              {/* 1. Microphone Toggle / Recording Button */}
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  disabled={loading}
                  title="Stop recording and submit answer via Whisper Small"
                  className="px-5 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{loading ? 'Submitting…' : 'Stop & Submit'}</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={loading || isSpeaking}
                  title="Start recording your answer"
                  className="px-5 h-12 rounded-full bg-[#76b900] hover:bg-[#86d100] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isSpeaking ? 'Interviewer Speaking…' : 'Start Speaking'}</span>
                </button>
              )}

              {/* 2. Camera Toggle Button */}
              <button
                onClick={toggleVideo}
                title={videoEnabled ? 'Turn camera off' : 'Turn camera on'}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  videoEnabled
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* 3. Whisper Small Mode Button */}
              <button
                onClick={() => {
                  whisperManager.setEnabled(!whisperState.enabled);
                }}
                title={`Whisper Small (244M params • 3.3x Base) Mode: ${whisperState.enabled ? 'Enabled' : 'Disabled'}`}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  whisperState.enabled
                    ? 'bg-[#76b900]/15 border-[#76b900]/40 text-[#76b900]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-400'
                }`}
              >
                <Radio className="w-5 h-5" />
              </button>

              {/* 4. Type Answer Toggle Button */}
              <button
                onClick={() => setUseTextInput(!useTextInput)}
                title={useTextInput ? 'Hide text input' : 'Type answer instead of speaking'}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  useTextInput
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-300'
                }`}
              >
                <FileText className="w-5 h-5" />
              </button>

              {/* 5. Submit Text Answer (if text mode active) */}
              {useTextInput && !isRecording && (
                <button
                  onClick={submitTextAnswer}
                  disabled={loading || !textAnswer.trim()}
                  className="px-4 h-12 rounded-full bg-[#76b900] hover:bg-[#86d100] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Submit</span>
                </button>
              )}

              {/* 6. End Call / Leave Meeting Button (Google Meet Red End Call) */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to finish and leave this interview session? Your progress will be evaluated.')) {
                    completeInterview();
                  }
                }}
                title="End interview & view feedback"
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>

      {/* Switch-provider modal */}
      {showSwitchProvider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !switchBusy && setShowSwitchProvider(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Switch AI Provider</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Re-analyze your last answer using a different BYOK provider. Add providers in Settings first if needed.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(configuredProviders).map(([key, val]) => (
                <button
                  key={key}
                  onClick={async () => {
                    useAIConfigStore.getState().setActiveProvider(key);
                    await switchProvider();
                  }}
                  disabled={switchBusy || key === activeConfig}
                  className={
                    'w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between ' +
                    (key === activeConfig
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-muted/30 border-border text-foreground hover:border-primary/30')
                  }
                >
                  <span className="font-medium capitalize">{key}</span>
                  {key === activeConfig && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
              {Object.keys(configuredProviders).length === 0 && (
                <p className="text-sm text-muted-foreground">No providers configured. Visit Settings to add one.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSwitchProvider(false)} disabled={switchBusy}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  if (step === 'feedback' && overallResults) {
    const getScoreColor = (score) => {
      if (score >= 80) return 'emerald';
      if (score >= 60) return 'amber';
      return 'red';
    };

    const getScoreLabel = (score) => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Very Good';
      if (score >= 70) return 'Good';
      if (score >= 60) return 'Fair';
      if (score >= 50) return 'Needs Work';
      return 'Needs Improvement';
    };

    const scoreColor = getScoreColor(overallResults.overallScore);
    const scoreGradientClass = {
      emerald: 'from-emerald-500 to-emerald-600',
      amber: 'from-amber-500 to-amber-600',
      red: 'from-red-500 to-red-600'
    }[scoreColor] || 'from-emerald-500 to-emerald-600';
    const scoreShadowClass = {
      emerald: 'shadow-emerald-500/30',
      amber: 'shadow-amber-500/30',
      red: 'shadow-red-500/30'
    }[scoreColor] || 'shadow-emerald-500/30';
    const avgRelevance = overallResults.answers?.reduce((sum, a) => sum + (a.analysis?.relevance || 0), 0) / (overallResults.answers?.length || 1) || 0;
    const avgClarity = overallResults.answers?.reduce((sum, a) => sum + (a.analysis?.clarity || 0), 0) / (overallResults.answers?.length || 1) || 0;
    const avgConfidence = overallResults.answers?.reduce((sum, a) => sum + (a.analysis?.confidence || 0), 0) / (overallResults.answers?.length || 1) || 0;
    const totalFillerWords = overallResults.answers?.reduce((sum, a) => sum + (a.analysis?.fillerWords?.count || 0), 0) || 0;
    const expressionScore = overallResults.overallFeedback?.expressionAnalysis?.overallConfidence || 0;
    const getCommunicationRating = () => {
  if (avgClarity >= 85 && avgConfidence >= 85) return 'Excellent';
  if (avgClarity >= 75 && avgConfidence >= 75) return 'Strong';
  if (avgClarity >= 65 && avgConfidence >= 65) return 'Good';
  return 'Needs Improvement';
};

const communicationTips = [];

if (avgConfidence < 70) {
  communicationTips.push(
    'Practice speaking more confidently and reduce hesitation.'
  );
}

if (avgClarity < 70) {
  communicationTips.push(
    'Structure responses using the STAR method.'
  );
}

if (totalFillerWords > 5) {
  communicationTips.push(
    "Reduce filler words such as 'um', 'uh', and 'like'."
  );
}

if (communicationTips.length === 0) {
  communicationTips.push(
    'Excellent communication skills. Keep practicing regularly.'
  );
}

    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="relative inline-block mb-6">
              <div className={`w-24 h-24 bg-gradient-to-br ${scoreGradientClass} rounded-3xl flex items-center justify-center shadow-2xl ${scoreShadowClass}`}>
                <Award className="w-14 h-14 text-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">Interview Complete!</h1>

            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
  <h3 className="text-xl font-bold mb-2">
    Interview Readiness Score
  </h3>

  <p className="text-5xl font-bold text-primary">
    {overallResults.overallScore}%
  </p>

  <p className="text-muted-foreground mt-2">
    Based on confidence, communication, and answer quality.
  </p>
</div>

            <p className="text-lg text-muted-foreground">Here's your comprehensive performance analysis</p>
          </motion.div>
          <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.05 }}
  className="mb-8"
>
  <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">

    <h2 className="text-2xl font-bold mb-4">
      Adaptive Interview Progress
    </h2>

    <div className="grid md:grid-cols-2 gap-4">

      <div>
        <p className="text-muted-foreground">
          Current Level
        </p>

        <p className="text-xl font-bold">
          {progressData.level}
        </p>
      </div>

      <div>
        <p className="text-muted-foreground">
          Average Score
        </p>

        <p className="text-xl font-bold">
          {progressData.averageScore}%
        </p>
      </div>

      <div>
        <p className="text-muted-foreground">
          Interviews Completed
        </p>

        <p className="text-xl font-bold">
          {progressData.completedInterviews}
        </p>
      </div>

      <div>
        <p className="text-muted-foreground">
          Success Streak
        </p>

        <p className="text-xl font-bold">
          {progressData.streak}/3
        </p>
      </div>

    </div>

    <div className="mt-6">

      <p className="mb-2 text-sm text-muted-foreground">
        Progress To Next Level
      </p>

      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">

        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{
            width: `${progressData.streak * 33}%`
          }}
        />

      </div>

    </div>

  </div>
</motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-border backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
                <div className="relative">
                  <svg className="w-44 h-44 transform -rotate-90">
                    <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted-foreground/60" />
                    <motion.circle initial={{ strokeDashoffset: 478 }} animate={{ strokeDashoffset: 478 - (478 * overallResults.overallScore) / 100 }} transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }} cx="88" cy="88" r="76" stroke="url(#scoreGradient)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="478" />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {overallResults.overallScore}%
                    </motion.span>
                    <span className="text-muted-foreground text-sm font-medium mt-1">{getScoreLabel(overallResults.overallScore)}</span>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Performance Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground text-sm flex items-center gap-2"><Target className="w-4 h-4 text-sky-400" />Answer Relevance</span>
                        <span className="text-sky-400 font-semibold">{Math.round(avgRelevance)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${avgRelevance}%` }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-400" />Communication Clarity</span>
                        <span className="text-emerald-400 font-semibold">{Math.round(avgClarity)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${avgClarity}%` }} transition={{ delay: 0.7, duration: 1 }} className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" />Verbal Confidence</span>
                        <span className="text-purple-400 font-semibold">{Math.round(avgConfidence)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${avgConfidence}%` }} transition={{ delay: 0.8, duration: 1 }} className="h-full bg-gradient-to-r from-secondary to-purple-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-foreground text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-amber-400" />Body Language & Expression</span>
                        <span className="text-amber-400 font-semibold">{Math.round(expressionScore)}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${expressionScore}%` }} transition={{ delay: 0.9, duration: 1 }} className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{overallResults.answeredQuestions}/{overallResults.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Questions Answered</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <p className="text-2xl font-bold text-sky-400">{formatTime(overallResults.duration)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Duration</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{Math.round((avgRelevance + avgClarity + avgConfidence) / 3)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Answer Quality</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{totalFillerWords}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filler Words Used</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{overallResults.answers?.length > 0 ? Math.round(overallResults.duration / overallResults.answers.length) : 0}s</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Response Time</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="mb-8"
>
  <div className="p-8 rounded-3xl bg-background/50 border border-border">

    <h2 className="text-2xl font-bold mb-6">
      Communication & Confidence Analysis
    </h2>

    <div className="grid md:grid-cols-4 gap-4 mb-6">

      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-sm text-muted-foreground">
          Communication Score
        </p>
        <p className="text-3xl font-bold text-emerald-400">
          {Math.round(avgClarity)}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-sm text-muted-foreground">
          Confidence Score
        </p>
        <p className="text-3xl font-bold text-purple-400">
          {Math.round(avgConfidence)}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-muted-foreground">
          Filler Words
        </p>
        <p className="text-3xl font-bold text-red-400">
          {totalFillerWords}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-muted-foreground">
          Rating
        </p>
        <p className="text-xl font-bold text-amber-400">
          {getCommunicationRating()}
        </p>
      </div>

    </div>

    <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
      <h3 className="font-semibold mb-3">
        Communication Improvement Roadmap
      </h3>

      <ul className="space-y-2">
        {communicationTips.map((tip, index) => (
          <li key={index}>
            • {tip}
          </li>
        ))}
      </ul>
    </div>

  </div>
</motion.div>

          {overallResults.overallFeedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-border backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">AI Performance Summary</h3>
                    <p className="text-muted-foreground text-sm">Personalized feedback based on your interview</p>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed text-lg bg-muted/30 p-5 rounded-2xl border border-border/50">{overallResults.overallFeedback.summary}</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="h-full p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Your Strengths</h3>
                    <p className="text-emerald-400/70 text-sm">Areas where you excelled</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {overallResults.overallFeedback?.topStrengths?.map((s, i) => (
                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-sm font-bold">{i + 1}</span>
                      </div>
                      <span className="text-foreground/90">{s}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="h-full p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Areas to Develop</h3>
                    <p className="text-amber-400/70 text-sm">Focus on these for improvement</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {overallResults.overallFeedback?.areasToImprove?.map((a, i) => (
                    <motion.li initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/10">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className="text-foreground/90">{a}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.35 }}
  className="mb-8"
>
  <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">

    <h2 className="text-2xl font-bold mb-4">
      Areas To Improve
    </h2>

    <p className="text-muted-foreground mb-5">
      Focus on these areas before your next interview.
    </p>

    <div className="space-y-3">
      {overallResults.overallFeedback?.areasToImprove?.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-xl bg-background/50 border border-border"
        >
          <div className="flex items-start gap-3">

            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />

            <span className="text-foreground">
              {item}
            </span>

          </div>
        </div>
      ))}
    </div>

  </div>
</motion.div>

            <LearningRecommendations
  areasToImprove={
    overallResults.overallFeedback?.areasToImprove || []
  }
/>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Expert Recommendations</h3>
                  <p className="text-primary/70 text-sm">Actionable steps for your next interview</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overallResults.overallFeedback?.recommendations?.map((r, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} key={i} className="p-4 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-primary font-bold text-sm">{i + 1}</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{r}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {overallResults.overallFeedback?.expressionAnalysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Body Language Analysis</h3>
                    <p className="text-cyan-400/70 text-sm">Insights from facial expression tracking</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-foreground">Expression Confidence Score</span>
                      <span className="text-2xl font-bold text-cyan-400">{overallResults.overallFeedback.expressionAnalysis.overallConfidence}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${overallResults.overallFeedback.expressionAnalysis.overallConfidence}%` }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border/50">
                    <p className="text-muted-foreground text-sm mb-2">AI Feedback</p>
                    <p className="text-foreground/90 leading-relaxed">{overallResults.overallFeedback.expressionAnalysis.feedback}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {overallResults.answers && overallResults.answers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-900/40 border border-border backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Question-by-Question Analysis</h3>
                    <p className="text-muted-foreground text-sm">Detailed breakdown of each response</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {overallResults.answers.map((answer, i) => (
                    <QuestionAnalysisCard key={i} answer={answer} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-wrap gap-4">
            <Button onClick={resetInterview} variant="primary" className="flex-1 !py-5 !rounded-2xl flex items-center justify-center gap-3 !text-lg font-semibold min-w-[200px]">
              <Mic className="w-6 h-6" />
              Start New Interview
            </Button>
            <Button
              onClick={() => setShareOpen((s) => !s)}
              variant="secondary"
              className="flex-1 !py-5 !rounded-2xl flex items-center justify-center gap-3 !text-lg font-semibold min-w-[200px]"
            >
              <Share2 className="w-6 h-6" />
              Share My Score
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 !py-5 !rounded-2xl flex items-center justify-center gap-3 !text-lg font-semibold min-w-[200px]">
              Back to Dashboard
              <ArrowRight className="w-6 h-6" />
            </Button>
          </motion.div>

          {shareOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
                Capture your score as an image and share it on LinkedIn, X/Twitter, or download it.
              </p>
              <Button onClick={handleShare} disabled={shareBusy} variant="primary" className="!py-2 !text-sm">
                {shareBusy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Share2 className="w-4 h-4 mr-1.5" />}
                Share Image
              </Button>
              <Button onClick={handleDownloadShare} disabled={shareBusy} variant="outline" className="!py-2 !text-sm">
                <Download className="w-4 h-4 mr-1.5" />
                Download PNG
              </Button>
            </motion.div>
          )}

          {/* Offscreen card used for html2canvas capture */}
          <div style={{ position: 'fixed', left: '-99999px', top: 0 }} aria-hidden="true">
            <Suspense fallback={null}>
              <ShareCard ref={shareCardRef} interview={overallResults} />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
