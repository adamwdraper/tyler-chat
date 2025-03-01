import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Stack,
  Avatar,
  useTheme,
  Divider,
  CircularProgress,
  Button,
  keyframes,
  Fade,
  Tooltip,
  Chip,
  Modal,
  Alert,
  Menu,
  MenuItem,
  Link,
} from '@mui/material';
import { 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconCode,
  IconDots,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
  IconMessage,
  IconTool,
  IconPlaystationCircle,
  IconCopy,
  IconCheck,
  IconMarkdown,
  IconAbc,
  IconClock,
  IconPaperclip,
  IconX,
  IconDotsVertical,
  IconBug,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { addMessage, processThread, createThread, updateThread, deleteThread, setCurrentThread } from '@/store/chat/ChatSlice';
import { RootState } from '@/store/Store';
import { Message, Thread, ToolCall, TextContent, ImageContent, MessageCreate, MessageAttachment } from '@/types/chat';
import Scrollbar from '@/components/custom-scroll/Scrollbar';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useTimeAgoUpdater } from '@/hooks/useTimeAgoUpdater';
import { useNavigate, useParams } from 'react-router-dom';

const dotAnimation = keyframes`
  0%, 20% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-6px);
  }
  80%, 100% {
    opacity: 0.2;
    transform: translateY(0);
  }
`;

const titleTypingAnimation = keyframes`
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
`;

const TypingDots: React.FC = () => {
  return (
    <Stack 
      direction="row" 
      spacing={1}
      alignItems="center"
      sx={{ 
        px: 2,
        py: 1,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            animation: `${dotAnimation} 2s infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </Stack>
  );
};

const AudioPlayer: React.FC<{ src: string, filename: string }> = ({ src, filename }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(event.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  return (
    <Box sx={{ 
      width: '100%',
      borderRadius: 1,
      border: 1,
      borderColor: 'divider',
      p: 2,
      bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
    }}>
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ display: 'none' }}
      />
      <Stack spacing={1}>
        <Typography variant="subtitle2" noWrap title={filename}>
          {filename}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton 
            onClick={handlePlayPause} 
            size="small"
            color="primary"
          >
            {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </IconButton>
          <Typography variant="caption" sx={{ minWidth: 45 }}>
            {formatTime(currentTime)}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={{ width: '100%' }}
            />
          </Box>
          <Typography variant="caption" sx={{ minWidth: 45 }}>
            {formatTime(duration)}
          </Typography>
          <IconButton 
            onClick={handleMuteToggle} 
            size="small"
          >
            {isMuted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
          </IconButton>
          <Box sx={{ width: 60 }}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: '100%' }}
            />
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

const ChatContent: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [contentHeights, setContentHeights] = React.useState<Map<string, number>>(new Map());
  const [isNewTitle, setIsNewTitle] = React.useState(false);
  const [fadeIn, setFadeIn] = React.useState(true);
  const [expandedSystemMessages, setExpandedSystemMessages] = React.useState<Set<string>>(new Set());
  const [expandedToolCalls, setExpandedToolCalls] = React.useState<Set<string>>(new Set());
  const [expandedToolResults, setExpandedToolResults] = React.useState<Set<string>>(new Set());
  const contentRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const [hoveredMessageId, setHoveredMessageId] = React.useState<string | null>(null);
  const maxHeight = 300; // About 15 lines of text
  const wsRef = useRef<WebSocket>();
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  const [plainTextMessages, setPlainTextMessages] = React.useState<Set<string>>(new Set());
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isRawView, setIsRawView] = useState(false);
  
  const { threads, currentThread } = useSelector((state: RootState) => state.chat);
  const activeThread = threads.find((t: Thread) => t.id === currentThread);

  // Only sync from URL to Redux when there's a thread ID
  useEffect(() => {
    if (threadId) {
      dispatch(setCurrentThread(threadId));
    }
  }, [threadId, dispatch]);

  // Only sync from Redux to URL when there's a thread
  useEffect(() => {
    if (currentThread && window.location.pathname === '/') {
      navigate(`/thread/${currentThread}`, { replace: true });
    }
  }, [currentThread, navigate]);

  // Use the custom hook for periodic updates
  const updateTimestamps = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  useTimeAgoUpdater(updateTimestamps);

  // Sort messages by sequence
  const sortedMessages = React.useMemo(() => {
    if (!activeThread?.messages) return [];
    return [...activeThread.messages].sort((a, b) => {
      const seqA = a.sequence ?? Number.MAX_SAFE_INTEGER;
      const seqB = b.sequence ?? Number.MAX_SAFE_INTEGER;
      return seqA - seqB;
    });
  }, [activeThread?.messages]);

  // Add fade effect when thread changes
  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 150);
    setSelectedAttachment(null); // Close modal when thread changes
    return () => clearTimeout(timer);
  }, [currentThread]);

  // WebSocket connection management
  useEffect(() => {
    if (currentThread && activeThread?.title === 'New Chat') {
      // Connect to WebSocket for this thread
      const ws = new WebSocket(`ws://localhost:8000/ws/threads/${currentThread}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'title_update' && data.thread_id === currentThread) {
          setIsNewTitle(true);
          dispatch(updateThread(data.thread));
          // Reset the animation flag after animation duration
          setTimeout(() => setIsNewTitle(false), 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;

      // Cleanup on unmount or when thread changes
      return () => {
        ws.close();
        wsRef.current = undefined;
      };
    }
  }, [currentThread, activeThread?.title]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, isProcessing]);

  useEffect(() => {
    const newHeights = new Map<string, number>();
    contentRefs.current.forEach((ref, messageId) => {
      if (ref) {
        newHeights.set(messageId, ref.scrollHeight);
      }
    });
    setContentHeights(newHeights);
  }, [activeThread?.messages]);

  // Add file validation constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to match backend
  const ALLOWED_MIME_TYPES = new Set([
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-tar',
    'application/gzip',
    // Audio files
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/opus',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ]);

  // Add validation helper
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return `File type ${file.type || 'unknown'} is not supported for ${file.name}`;
    }
    return null;
  };

  // Update file selection handler with validation
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // You can replace this with your preferred error notification system
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
    }

    setAttachments(prev => [...prev, ...validFiles]);
    if (event.target) {
      event.target.value = ''; // Reset input
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Update drop handler with validation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // You can replace this with your preferred error notification system
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    let threadId = currentThread;
    
    if (!threadId) {
      const newThread = await dispatch(createThread({ title: 'New Chat' })).unwrap();
      threadId = newThread.id;
      navigate(`/thread/${threadId}`, { replace: true });
    }

    if (!threadId) return;

    setIsProcessing(true);
    
    try {
      // Create message with file attachments
      const fileAttachments = attachments.map((file) => ({
        file,
        filename: file.name,
        mime_type: file.type
      }));

      // Create message with the new structure
      const messageCreate: MessageCreate = {
        role: 'user',
        content: newMessage || '', // Ensure content is never undefined
        attributes: {},
        attachments: fileAttachments
      };

      // Add message and process in one call
      await dispatch(addMessage({
        threadId,
        message: messageCreate,
        process: true
      })).unwrap();

      setNewMessage('');
      setAttachments([]); // Clear attachments after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'assistant':
        return <IconRobot size={20} />;
      case 'system':
      case 'tool':
        return <IconCode size={20} />;
      default:
        return <IconUser size={20} />;
    }
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case 'assistant':
        return 'primary.main';
      case 'system':
      case 'tool':
        return 'warning.main';
      default:
        return 'secondary.main';
    }
  };

  const toggleMessageExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const isJsonString = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isPythonDictString = (str: string) => {
    try {
      // First unescape any escaped quotes
      let processedStr = str.replace(/\\"/g, '"').replace(/\\'/g, "'");
      
      // Remove any outer quotes
      processedStr = processedStr.trim();
      if ((processedStr.startsWith('"') && processedStr.endsWith('"')) || 
          (processedStr.startsWith("'") && processedStr.endsWith("'"))) {
        processedStr = processedStr.slice(1, -1);
      }

      // Find the first occurrence of '{'
      const firstBrace = processedStr.indexOf('{');
      if (firstBrace === -1) {
        return false;
      }

      // Extract from the first '{' to the end
      const dictPart = processedStr.slice(firstBrace);
      
      // Replace Python True/False/None with JSON true/false/null
      const jsonified = dictPart
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null')
        .replace(/'/g, '"'); // Replace single quotes with double quotes
      
      JSON.parse(jsonified);
      return true;
    } catch (e) {
      return false;
    }
  };

  const formatPythonDict = (str: string) => {
    // First unescape any escaped quotes
    let processedStr = str.replace(/\\"/g, '"').replace(/\\'/g, "'");
    
    // Remove any outer quotes
    processedStr = processedStr.trim();
    if ((processedStr.startsWith('"') && processedStr.endsWith('"')) || 
        (processedStr.startsWith("'") && processedStr.endsWith("'"))) {
      processedStr = processedStr.slice(1, -1);
    }

    // Find the first occurrence of '{'
    const firstBrace = processedStr.indexOf('{');
    if (firstBrace === -1) {
      throw new Error('No dictionary found');
    }

    // Extract from the first '{' to the end
    const dictPart = processedStr.slice(firstBrace);
    
    // Convert Python dict string to JSON format
    const jsonified = dictPart
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null')
      .replace(/'/g, '"');
    
    return JSON.parse(jsonified);
  };

  const renderFormattedCode = (data: any, functionName?: string, messageId?: string) => {
    const isToolResultExpanded = messageId ? expandedToolResults.has(messageId) : true;
    
    // If no message ID or function name, just render the data
    if (!messageId || !functionName) {
      return (
        <Paper
          variant="outlined"
          sx={{
            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            fontFamily: 'monospace',
            overflow: 'hidden',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            width: '100%',
            wordBreak: 'break-word',
            color: 'text.secondary',
            p: 2,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Paper>
      );
    }
    
    // Collapsed view for tool results
    if (!isToolResultExpanded) {
      return (
        <Paper
          variant="outlined"
          onClick={() => toggleToolResult(messageId)}
          sx={{
            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            fontFamily: 'monospace',
            overflow: 'hidden',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            width: '100%',
            wordBreak: 'break-word',
            color: 'text.secondary',
            p: 2,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
            }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <IconTool size={16} />
              <Typography variant="body2" fontWeight={600} color="secondary.main">
                {functionName} Result
              </Typography>
            </Stack>
            <IconChevronDown size={16} style={{ color: theme.palette.text.secondary }} />
          </Stack>
        </Paper>
      );
    }
    
    // Expanded view for tool results
    return (
      <Paper
        variant="outlined"
        sx={{
          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
          fontFamily: 'monospace',
          overflow: 'hidden',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          width: '100%',
          wordBreak: 'break-word',
          color: 'text.secondary',
          p: 2,
        }}
      >
        <Stack spacing={1}>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            onClick={() => toggleToolResult(messageId)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                color: 'text.primary'
              }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <IconTool size={16} />
              <Typography variant="body2" fontWeight={600} color="secondary.main">
                {functionName} Result
              </Typography>
            </Stack>
            <IconChevronUp size={16} style={{ color: theme.palette.text.secondary }} />
          </Stack>
          <Box sx={{ mt: 1 }}>
            {JSON.stringify(data, null, 2)}
          </Box>
        </Stack>
      </Paper>
    );
  };

  const renderMarkdown = (content: string) => {
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <Typography variant="body1" component="p">
              {children}
            </Typography>
          ),
          a: ({ href, children }) => (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  color: 'primary.dark',
                  textDecoration: 'underline',
                },
                '&:visited': {
                  color: 'secondary.main',
                },
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {children}
            </Link>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const toggleMessageFormat = (messageId: string) => {
    setPlainTextMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const renderContent = (content: string | (TextContent | ImageContent)[], role: string, message: Message, messages: Message[]) => {
    if (typeof content === 'string') {
      if (role === 'tool') {
        try {
          const parsedContent = JSON.parse(content);
          return renderFormattedCode(parsedContent, message.name, message.id);
        } catch {
          return renderFormattedCode(content, message.name, message.id);
        }
      }
      const isPlainText = plainTextMessages.has(message.id);
      return isPlainText ? (
        <Typography 
          variant="body1" 
          component="pre" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            m: 0
          }}
        >
          {content}
        </Typography>
      ) : renderMarkdown(content);
    }

    // Handle array of content
    return (
      <Stack spacing={2}>
        {content.map((item, index) => {
          if (item.type === 'text') {
            if (role === 'tool') {
              return renderFormattedCode(item.text, message.name, message.id);
            }
            const isPlainText = plainTextMessages.has(message.id);
            return isPlainText ? (
              <Typography 
                key={index}
                variant="body1" 
                component="pre" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  m: 0
                }}
              >
                {item.text}
              </Typography>
            ) : renderMarkdown(item.text);
          } else if (item.type === 'image_url') {
            return (
              <Box 
                key={index} 
                sx={{ 
                  maxWidth: '100%', 
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // Create a MessageAttachment object from the image URL
                  const attachment: MessageAttachment = {
                    filename: 'image.png', // Default filename
                    mime_type: 'image/png',
                    processed_content: {
                      type: 'image',
                      url: item.image_url.url,
                      content: item.image_url.url
                    }
                  };
                  handleAttachmentClick(attachment);
                }}
              >
                <img 
                  src={item.image_url.url} 
                  alt="Message content" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    maxHeight: 300,
                    borderRadius: theme.shape.borderRadius 
                  }} 
                />
              </Box>
            );
          }
          return null;
        })}
      </Stack>
    );
  };

  const handleCopyMessage = async (message: Message) => {
    let textToCopy = '';
    if (typeof message.content === 'string') {
      textToCopy = message.content;
    } else if (Array.isArray(message.content)) {
      textToCopy = message.content
        .filter(item => item.type === 'text')
        .map(item => (item as TextContent).text)
        .join('\n\n');
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const getImageUrl = (content: any, mimeType?: string): string | null | undefined => {
    if (!content) return undefined;
    
    // Check for URL in processed_content
    if (content.url) return content.url;
    
    // Check for base64 content
    if (typeof content === 'string') {
      return content.startsWith('data:') 
        ? content 
        : `data:${mimeType || 'image/*'};base64,${content}`;
    }
    
    // Check for content field with base64 data
    if (content.content) {
      return `data:${content.mime_type || mimeType || 'image/*'};base64,${content.content}`;
    }
    
    return undefined;
  };

  // Static components defined outside of ChatMessage
  const MessageMetrics = React.memo(({ metrics }: { metrics: Message['metrics'] }) => (
    <>
      {metrics?.weave_call?.ui_url && (
        <Tooltip title="View trace in Weave" arrow placement="top">
          <Link
            href={metrics.weave_call.ui_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            <IconBug size={14} />
          </Link>
        </Tooltip>
      )}
      {metrics?.usage?.total_tokens > 0 && (
        <Tooltip
          title={
            <Box sx={{ p: 1, fontFamily: 'monospace', color: 'common.white' }}>
              {metrics.model || 'Unknown Model'}:
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <span>Prompt:</span>
                <span>{metrics.usage.prompt_tokens.toLocaleString()}</span>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <span>Completion:</span>
                <span>{metrics.usage.completion_tokens.toLocaleString()}</span>
              </Box>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <span>Total:</span>
                <span>{metrics.usage.total_tokens.toLocaleString()}</span>
              </Box>
            </Box>
          }
          arrow
          placement="top"
        >
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
            <IconPlaystationCircle size={14} />
            {metrics.usage.total_tokens.toLocaleString()}
          </Box>
        </Tooltip>
      )}
      {metrics?.timing?.latency > 0 && (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconClock size={14} />
          {(metrics.timing.latency / 1000).toFixed(2)}s
        </Box>
      )}
    </>
  ));

  const MessageTimeAgo = React.memo(({ timestamp }: { timestamp?: string }) => (
    <Box component="span">
      {timestamp ? formatTimeAgo(timestamp) : ''}
    </Box>
  ), () => true);

  const MessageHoverActions = React.memo(({ 
    isHovered,
    isCopied,
    isToolRelated,
    isPlainText,
    onCopy,
    onToggleFormat 
  }: { 
    isHovered: boolean;
    isCopied: boolean;
    isToolRelated: boolean;
    isPlainText: boolean;
    onCopy: () => void;
    onToggleFormat: () => void;
  }) => {
    if (!isHovered) return null;
    return (
      <Fade in={true}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton
            onClick={onCopy}
            size="small"
            sx={{ 
              p: 0.5,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </IconButton>
          {!isToolRelated && (
            <Tooltip title={isPlainText ? "Show as Markdown" : "Show as plain text"}>
              <IconButton
                onClick={onToggleFormat}
                size="small"
                sx={{ 
                  p: 0.5,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                {isPlainText ? <IconMarkdown size={14} /> : <IconAbc size={14} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Fade>
    );
  });

  const ChatMessage = React.memo(({ 
    message, 
    isLastMessage, 
    toggleMessageFormat,
    expandedMessages,
    contentHeights,
    toggleMessageExpand,
    contentRefs,
    maxHeight,
    plainTextMessages,
    messages,
    toggleSystemMessage,
    expandedSystemMessages,
    expandedToolCalls,
    toggleToolCall,
    expandedToolResults,
    toggleToolResult,
    isRawView,
  }: {
    message: Message;
    isLastMessage: boolean;
    toggleMessageFormat: (messageId: string) => void;
    expandedMessages: Set<string>;
    contentHeights: Map<string, number>;
    toggleMessageExpand: (messageId: string) => void;
    contentRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
    maxHeight: number;
    plainTextMessages: Set<string>;
    messages: Message[];
    toggleSystemMessage: (messageId: string) => void;
    expandedSystemMessages: Set<string>;
    expandedToolCalls: Set<string>;
    toggleToolCall: (toolCallId: string) => void;
    expandedToolResults: Set<string>;
    toggleToolResult: (messageId: string) => void;
    isRawView: boolean;
  }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isCopied, setIsCopied] = React.useState(false);
    const isExpanded = expandedMessages.has(message.id);
    const contentHeight = contentHeights.get(message.id) || 0;
    const shouldShowExpand = contentHeight > maxHeight;
    const isToolRelated = message.role === 'tool' || !!message.tool_call_id;
    const isPlainText = plainTextMessages.has(message.id);
    const isSystemMessage = message.role === 'system';
    const isSystemExpanded = expandedSystemMessages.has(message.id);

    const handleCopyMessage = React.useCallback(async () => {
      let textToCopy = '';
      if (typeof message.content === 'string') {
        textToCopy = message.content;
      } else if (Array.isArray(message.content)) {
        textToCopy = message.content
          .filter(item => item.type === 'text')
          .map(item => (item as TextContent).text)
          .join('\n\n');
      }

      try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy message:', err);
      }
    }, [message.content]);

    const setContentRef = React.useCallback((el: HTMLDivElement | null) => {
      if (el) {
        contentRefs.current.set(message.id, el);
      }
    }, [message.id, contentRefs]);

    // Raw view rendering
    if (isRawView) {
      return (
        <Box 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Box p={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 900 }}>
              <Stack direction="row" gap="16px" mb={2}>
                <Avatar
                  sx={{
                    bgcolor: getMessageColor(message.role),
                    width: 30,
                    height: 30,
                    color: 'white',
                    alignSelf: 'flex-start'
                  }}
                >
                  {getMessageIcon(message.role)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                      border: 1,
                      borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                  >
                    <Box component="code">
                      {JSON.stringify(message, null, 2)}
                    </Box>
                  </Box>
                  {/* Footer with metrics and timestamp */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 1,
                      gap: 2,
                      color: 'text.secondary',
                      typography: 'caption',
                      height: 28
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      alignItems: 'center', 
                      minWidth: 80,
                      height: '100%'
                    }}>
                      <MessageHoverActions 
                        isHovered={isHovered}
                        isCopied={isCopied}
                        isToolRelated={isToolRelated}
                        isPlainText={isPlainText}
                        onCopy={handleCopyMessage}
                        onToggleFormat={() => toggleMessageFormat(message.id)}
                      />
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      alignItems: 'center',
                      height: '100%'
                    }}>
                      {message.metrics && <MessageMetrics metrics={message.metrics} />}
                      <MessageTimeAgo timestamp={message.timestamp} />
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
          {!isLastMessage && <Divider />}
        </Box>
      );
    }

    // Special render for collapsed system message
    if (isSystemMessage && !isSystemExpanded) {
      return (
        <Box 
          onClick={() => toggleSystemMessage(message.id)}
          sx={{ 
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Box p={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 900 }}>
              <Stack direction="row" gap="16px" alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: getMessageColor('system'),
                    width: 30,
                    height: 30,
                    color: 'white'
                  }}
                >
                  <IconCode size={20} />
                </Avatar>
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  sx={{ 
                    flex: 1,
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    System Message
                  </Typography>
                  <IconChevronDown size={16} style={{ color: theme.palette.text.secondary }} />
                </Stack>
              </Stack>
            </Box>
          </Box>
          {!isLastMessage && <Divider />}
        </Box>
      );
    }

    return (
      <Box 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box p={3} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 900 }}>
            <Stack direction="row" gap="16px" mb={2}>
              <Avatar
                sx={{
                  bgcolor: getMessageColor(message.role),
                  width: 30,
                  height: 30,
                  color: 'white',
                  alignSelf: 'flex-start'
                }}
              >
                {getMessageIcon(message.role)}
              </Avatar>
              <Box sx={{ flex: 1, mt: '10px' }}>
                {isSystemMessage && (
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer', 
                      color: 'text.secondary',
                      justifyContent: 'space-between',
                      '&:hover': {
                        color: 'text.primary'
                      }
                    }}
                    onClick={() => toggleSystemMessage(message.id)}
                  >
                    <Typography variant="body2">
                      System Message
                    </Typography>
                    <IconChevronUp size={16} />
                  </Stack>
                )}
                {message.content && (
                  <>
                    <Box
                      sx={{
                        position: 'relative',
                        maxHeight: isSystemMessage ? 'none' : (isExpanded ? 'none' : maxHeight),
                        overflow: 'hidden',
                        mb: message.attachments && message.attachments.length > 0 ? 2 : 0
                      }}
                    >
                      <Box
                        ref={setContentRef}
                        sx={{
                          '& p': { 
                            m: 0, 
                            lineHeight: 1.5 
                          },
                          '& p + p': { 
                            mt: 1.5 
                          },
                          '& pre': {
                            m: 0,
                            p: 2,
                            borderRadius: 1,
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                            border: 1,
                            borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                          },
                          '& code': {
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            p: 0.5,
                            borderRadius: 0.5,
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                            color: theme => theme.palette.mode === 'dark' ? '#ce9178' : '#a31515',
                          },
                          '& pre code': {
                            p: 0,
                            bgcolor: 'transparent',
                            color: 'text.primary',
                          },
                        }}
                      >
                        {renderContent(message.content, message.role, message, messages)}
                      </Box>
                      {!isSystemMessage && !isExpanded && shouldShowExpand && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '110px',
                            background: theme => theme.palette.mode === 'dark' 
                              ? 'linear-gradient(180deg, transparent 0%, rgba(33,33,33,0.8) 50%, rgba(33,33,33,0.95) 100%)'
                              : 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.95) 100%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            pt: 4,
                            zIndex: 1
                          }}
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => toggleMessageExpand(message.id)}
                            startIcon={<IconChevronDown size={16} />}
                            sx={{ mb: 1 }}
                          >
                            More
                          </Button>
                        </Box>
                      )}
                    </Box>
                    {!isSystemMessage && isExpanded && shouldShowExpand && (
                      <Box sx={{ textAlign: 'center', mt: 1, mb: message.attachments && message.attachments.length > 0 ? 2 : 0 }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => toggleMessageExpand(message.id)}
                          startIcon={<IconChevronUp size={16} />}
                        >
                          Less
                        </Button>
                      </Box>
                    )}
                  </>
                )}

                {/* Render tool calls if present */}
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                      {message.tool_calls.map((toolCall) => {
                        const isToolCallExpanded = expandedToolCalls.has(toolCall.id);
                        
                        // Collapsed view
                        if (!isToolCallExpanded) {
                          return (
                            <Paper
                              key={toolCall.id}
                              variant="outlined"
                              onClick={() => toggleToolCall(toolCall.id)}
                              sx={{
                                bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                fontSize: '0.875rem',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                width: '100%',
                                wordBreak: 'break-word',
                                color: 'text.secondary',
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
                                }
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <IconTool size={16} />
                                  <Typography variant="body2" fontWeight={600} color="secondary.main">
                                    {toolCall.function.name}
                                  </Typography>
                                </Stack>
                                <IconChevronDown size={16} style={{ color: theme.palette.text.secondary }} />
                              </Stack>
                            </Paper>
                          );
                        }
                        
                        // Expanded view
                        return (
                          <Paper
                            key={toolCall.id}
                            variant="outlined"
                            sx={{
                              bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              fontSize: '0.875rem',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              width: '100%',
                              wordBreak: 'break-word',
                              color: 'text.secondary',
                              p: 2,
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack 
                                direction="row" 
                                justifyContent="space-between" 
                                alignItems="center"
                                onClick={() => toggleToolCall(toolCall.id)}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: 'text.primary'
                                  }
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <IconTool size={16} />
                                  <Typography variant="body2" fontWeight={600} color="secondary.main">
                                    {toolCall.function.name}
                                  </Typography>
                                </Stack>
                                <IconChevronUp size={16} style={{ color: theme.palette.text.secondary }} />
                              </Stack>
                              <Box sx={{ mt: 1 }}>
                                {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                              </Box>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Attachments section - outside of height restriction */}
                {message.attachments && message.attachments.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {message.attachments.map((attachment, index) => {
                        // First check for storage_path
                        let fileUrl = attachment.storage_path ? `/files/${attachment.storage_path}` : null;
                        
                        // If no storage_path, try to get URL from processed_content
                        if (!fileUrl) {
                          if (typeof attachment.mime_type === 'string' && attachment.mime_type.startsWith('image/')) {
                            fileUrl = getImageUrl(attachment.processed_content, attachment.mime_type);
                          } else {
                            // For non-image files, use the existing logic
                            if (attachment.processed_content?.url) {
                              fileUrl = attachment.processed_content.url;
                            } else if (attachment.processed_content?.content) {
                              fileUrl = `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.processed_content.content}`;
                            } else if (attachment.content) {
                              fileUrl = `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.content}`;
                            }
                          }
                        }
                        
                        // Handle image attachments
                        if (typeof attachment.mime_type === 'string' && attachment.mime_type.startsWith('image/')) {
                          return (
                            <Box 
                              key={index}
                              sx={{ 
                                width: '100%',
                                overflow: 'hidden',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                                p: 2,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleAttachmentClick(attachment)}
                            >
                              {fileUrl ? (
                                <Box sx={{ 
                                  height: '100%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center'
                                }}>
                                  <img 
                                    src={fileUrl}
                                    alt={attachment.filename}
                                    style={{ 
                                      maxWidth: '100%',
                                      height: 'auto',
                                      maxHeight: 300,
                                      display: 'block',
                                      margin: '0 auto',
                                      borderRadius: theme.shape.borderRadius
                                    }}
                                    onError={(e) => {
                                      console.error('Image failed to load:', {
                                        src: fileUrl,
                                        error: e
                                      });
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Processing image...
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        }
                        
                        // Handle audio attachments
                        if (typeof attachment.mime_type === 'string' && attachment.mime_type.startsWith('audio/')) {
                          return (
                            <Box 
                              key={index}
                              sx={{ 
                                width: '100%',
                                overflow: 'hidden',
                                borderRadius: 1,
                              }}
                            >
                              {fileUrl ? (
                                <AudioPlayer 
                                  src={fileUrl} 
                                  filename={attachment.filename} 
                                />
                              ) : (
                                <Box sx={{ p: 2, textAlign: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Processing audio...
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        }
                        
                        // Handle all other file types
                        return (
                          <Chip
                            key={index}
                            label={attachment.filename}
                            variant="outlined"
                            size="medium"
                            icon={<IconPaperclip size={16} />}
                            onClick={() => handleAttachmentClick(attachment)}
                            sx={{
                              cursor: 'pointer',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              },
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Footer with metrics and timestamp */}
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                    gap: 2,
                    color: 'text.secondary',
                    typography: 'caption',
                    height: 28
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center', 
                    minWidth: 80,
                    height: '100%'
                  }}>
                    <MessageHoverActions 
                      isHovered={isHovered}
                      isCopied={isCopied}
                      isToolRelated={isToolRelated}
                      isPlainText={isPlainText}
                      onCopy={handleCopyMessage}
                      onToggleFormat={() => toggleMessageFormat(message.id)}
                    />
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    {message.metrics && <MessageMetrics metrics={message.metrics} />}
                    <MessageTimeAgo timestamp={message.timestamp} />
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
        {!isLastMessage && <Divider />}
      </Box>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.isLastMessage === nextProps.isLastMessage &&
      prevProps.expandedMessages.has(prevProps.message.id) === nextProps.expandedMessages.has(nextProps.message.id) &&
      prevProps.contentHeights.get(prevProps.message.id) === nextProps.contentHeights.get(nextProps.message.id) &&
      prevProps.plainTextMessages.has(prevProps.message.id) === nextProps.plainTextMessages.has(nextProps.message.id) &&
      prevProps.expandedSystemMessages.has(prevProps.message.id) === nextProps.expandedSystemMessages.has(nextProps.message.id) &&
      prevProps.toggleSystemMessage === nextProps.toggleSystemMessage &&
      prevProps.expandedToolCalls.has(prevProps.message.id) === nextProps.expandedToolCalls.has(nextProps.message.id) &&
      prevProps.toggleToolCall === nextProps.toggleToolCall &&
      prevProps.expandedToolResults.has(prevProps.message.id) === nextProps.expandedToolResults.has(nextProps.message.id) &&
      prevProps.toggleToolResult === nextProps.toggleToolResult
    );
  });

  const renderMessage = (message: Message, index: number, messages: Message[]) => {
    // Skip tool responses as they'll be rendered with their calls, unless they have attachments
    if (message.role === 'tool' && !message.tool_call_id && (!message.attachments || message.attachments.length === 0)) {
      return null;
    }

    return (
      <ChatMessage
        key={message.id}
        message={message}
        isLastMessage={index === messages.length - 1}
        toggleMessageFormat={toggleMessageFormat}
        expandedMessages={expandedMessages}
        contentHeights={contentHeights}
        toggleMessageExpand={toggleMessageExpand}
        contentRefs={contentRefs}
        maxHeight={maxHeight}
        plainTextMessages={plainTextMessages}
        messages={messages}
        toggleSystemMessage={toggleSystemMessage}
        expandedSystemMessages={expandedSystemMessages}
        expandedToolCalls={expandedToolCalls}
        toggleToolCall={toggleToolCall}
        expandedToolResults={expandedToolResults}
        toggleToolResult={toggleToolResult}
        isRawView={isRawView}
      />
    );
  };

  const renderLoadingMessage = () => (
    <Box>
      <Box p={3}>
        <Stack direction="row" justifyContent="center">
          <TypingDots />
        </Stack>
      </Box>
    </Box>
  );

  const handleDeleteThread = async () => {
    if (currentThread) {
      await dispatch(deleteThread(currentThread));
    }
  };

  const calculateMetrics = () => {
    if (!activeThread) return { messages: 0, tools: 0, tokens: 0, totalLatency: 0 };
    
    const messageCount = activeThread.messages.length;
    
    // Calculate tool usage
    const toolCalls = activeThread.messages.reduce((count, msg) => 
      count + (msg.tool_calls?.length || 0), 0);
    
    // Calculate total tokens
    const totalTokens = activeThread.messages.reduce((total, msg) => 
      total + (msg.metrics?.usage?.total_tokens || 0), 0);

    // Calculate total latency
    const totalLatency = activeThread.messages.reduce((total, msg) => 
      total + (msg.metrics?.timing?.latency || 0), 0);

    return { 
      messages: messageCount, 
      tools: toolCalls, 
      tokens: totalTokens,
      totalLatency
    };
  };

  const calculateTokenUsage = () => {
    if (!activeThread) return { overall: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }, modelUsage: {} };
    
    const modelUsage: Record<string, {
      calls: number;
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    }> = {};
    
    let overall = {
      completion_tokens: 0,
      prompt_tokens: 0,
      total_tokens: 0
    };
    
    for (const message of activeThread.messages) {
      const metrics = message.metrics;
      if (!metrics?.usage) continue;
      
      // Update overall counts
      overall.completion_tokens += metrics.usage.completion_tokens || 0;
      overall.prompt_tokens += metrics.usage.prompt_tokens || 0;
      overall.total_tokens += metrics.usage.total_tokens || 0;
      
      // Update per-model counts
      if (metrics.model) {
        if (!modelUsage[metrics.model]) {
          modelUsage[metrics.model] = {
            calls: 0,
            completion_tokens: 0,
            prompt_tokens: 0,
            total_tokens: 0
          };
        }
        
        modelUsage[metrics.model].calls += 1;
        modelUsage[metrics.model].completion_tokens += metrics.usage.completion_tokens || 0;
        modelUsage[metrics.model].prompt_tokens += metrics.usage.prompt_tokens || 0;
        modelUsage[metrics.model].total_tokens += metrics.usage.total_tokens || 0;
      }
    }
    
    return {
      overall,
      modelUsage
    };
  };

  const calculateToolUsage = () => {
    if (!activeThread) return { tools: {}, total_calls: 0 };
    
    const toolCounts: Record<string, number> = {};
    let totalCalls = 0;
    
    for (const message of activeThread.messages) {
      if (message.tool_calls) {
        for (const call of message.tool_calls) {
          const toolName = call.function.name;
          toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
          totalCalls += 1;
        }
      }
    }
    
    return {
      tools: toolCounts,
      total_calls: totalCalls
    };
  };

  const handleCloseModal = () => {
    setSelectedAttachment(null);
  };

  const handleAttachmentClick = (attachment: MessageAttachment) => {
    setSelectedAttachment(attachment);
  };

  const FilePreviewModal = () => {
    if (!selectedAttachment) return null;

    const getFileUrl = (attachment: typeof selectedAttachment) => {
      // First check for storage_path for all file types
      if (attachment.storage_path) {
        return `/files/${attachment.storage_path}`;
      }
      
      const isImage = typeof attachment.mime_type === 'string' && attachment.mime_type.indexOf('image/') === 0;
      
      if (isImage) {
        return getImageUrl(attachment.processed_content, attachment.mime_type);
      }
      
      // For non-image files, use the existing logic
      if (attachment.processed_content?.url) {
        return attachment.processed_content.url;
      }
      if (attachment.processed_content?.content) {
        return `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.processed_content.content}`;
      }
      if (attachment.content) {
        return `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.content}`;
      }
      return null;
    };

    const renderContent = () => {
      const fileUrl = getFileUrl(selectedAttachment);
      if (!fileUrl) {
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Processing file...
            </Typography>
          </Box>
        );
      }

      // Handle PDFs and other documents that can be displayed in an iframe
      if (selectedAttachment.mime_type === 'application/pdf') {
        return (
          <Box sx={{ 
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            borderRadius: 'inherit'
          }}>
            <object
              data={fileUrl}
              type="application/pdf"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            >
              <iframe
                src={fileUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title={selectedAttachment.filename}
              />
            </object>
          </Box>
        );
      }

      // Handle audio files
      if (selectedAttachment.mime_type?.startsWith('audio/')) {
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 3
          }}>
            <Box sx={{ width: '100%', maxWidth: 600 }}>
              <AudioPlayer 
                src={fileUrl} 
                filename={selectedAttachment.filename} 
              />
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  href={fileUrl}
                  download={selectedAttachment.filename}
                  startIcon={<IconPaperclip size={20} />}
                >
                  Download {selectedAttachment.filename}
                </Button>
              </Box>
            </Box>
          </Box>
        );
      }

      // Handle images
      if (selectedAttachment.mime_type?.startsWith('image/')) {
        return (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <img 
              src={fileUrl}
              alt={selectedAttachment.filename}
              style={{ 
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                borderRadius: theme.shape.borderRadius
              }}
              onError={(e) => {
                console.error('Image failed to load:', {
                  src: fileUrl,
                  error: e
                });
              }}
            />
          </Box>
        );
      }

      // Handle text files
      if (
        selectedAttachment.mime_type === 'text/plain' ||
        selectedAttachment.mime_type === 'text/csv' ||
        selectedAttachment.mime_type === 'application/json'
      ) {
        // For text files, fetch and display content directly
        const [content, setContent] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          fetch(fileUrl)
            .then(response => response.text())
            .then(text => setContent(text))
            .catch(err => {
              console.error('Error fetching text content:', err);
              setError('Failed to load file content');
            });
        }, [fileUrl]);

        if (error) {
          return (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          );
        }

        if (!content) {
          return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          );
        }

        return (
          <Box sx={{ 
            p: 3,
            height: '100%',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: 'inherit',
            overflow: 'auto'
          }}>
            <pre style={{ 
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {content}
            </pre>
          </Box>
        );
      }
      
      // For all other files or when direct viewing is not possible
      return (
        <Stack spacing={2}>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              href={fileUrl}
              download={selectedAttachment.filename}
              startIcon={<IconPaperclip size={20} />}
            >
              Download {selectedAttachment.filename}
            </Button>
          </Box>
        </Stack>
      );
    };

    return (
      <Modal
        open={!!selectedAttachment}
        onClose={handleCloseModal}
        aria-labelledby="file-preview-modal"
        closeAfterTransition
        sx={{
          position: 'absolute',
          '& .MuiBackdrop-root': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
            position: 'absolute'
          }
        }}
        container={() => document.getElementById('chat-content-container')}
      >
        <Fade in={true}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: theme.palette.mode === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none'
          }}>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ 
                px: 3,
                py: 3,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" component="h2">
                  {selectedAttachment.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedAttachment.mime_type}
                </Typography>
              </Stack>
              <IconButton 
                onClick={handleCloseModal} 
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                }}
              >
                <IconX size={20} />
              </IconButton>
            </Stack>
            <Box sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              px: 3,
              pb: 3,
              pt: 2,
              height: 'calc(100vh - 88px)'
            }}>
              <Box sx={{
                height: '100%',
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                {renderContent()}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>
    );
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleDeleteThread();
    handleMenuClose();
  };

  // Add new function to toggle system message expansion
  const toggleSystemMessage = (messageId: string) => {
    setExpandedSystemMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Add new function to toggle tool call expansion
  const toggleToolCall = (toolCallId: string) => {
    setExpandedToolCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };

  // Add new function to toggle tool result expansion
  const toggleToolResult = (messageId: string) => {
    setExpandedToolResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        position: 'relative'
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={dropZoneRef}
      id="chat-content-container"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple
        accept={Array.from(ALLOWED_MIME_TYPES).join(',')}
      />
      {activeThread && (
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <IconMessage size={20} style={{ color: theme.palette.primary.main }} />
              <Typography variant="body2">
                {calculateMetrics().messages}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip
                title={
                  <Box sx={{ p: 1, fontFamily: 'monospace', color: 'common.white' }}>
                    {activeThread && (() => {
                      const { tools, total_calls } = calculateToolUsage();
                      const toolNames = Object.keys(tools);
                      
                      return (
                        <>
                          <Box sx={{ mb: 0.5 }}>Tool Usage:</Box>
                          {toolNames.map((toolName) => (
                            <Box key={toolName} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <span>{toolName}:</span>
                              <span>{tools[toolName]}</span>
                            </Box>
                          ))}
                          {toolNames.length > 1 && (
                            <>
                              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Total:</span>
                                <span>{total_calls}</span>
                              </Box>
                            </>
                          )}
                          {toolNames.length === 0 && (
                            <Box>No tools used</Box>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'default' }}>
                  <IconTool size={20} style={{ color: theme.palette.secondary.main }} />
                  <Typography variant="body2">
                    {calculateMetrics().tools}
                  </Typography>
                </Stack>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip
                title={
                  <Box sx={{ p: 1, fontFamily: 'monospace', color: 'common.white' }}>
                    {activeThread && (() => {
                      const { modelUsage, overall } = calculateTokenUsage();
                      const modelCount = Object.keys(modelUsage).length;
                      
                      return (
                        <>
                          <Box sx={{ mb: 0.5 }}>Token Usage by Model:</Box>
                          {Object.entries(modelUsage || {}).map(([model, usage]) => (
                            <Box key={model}>
                              <Box sx={{ mt: 1, mb: 0.5 }}>
                                {model}:
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Prompt:</span>
                                <span>{usage.prompt_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Completion:</span>
                                <span>{usage.completion_tokens.toLocaleString()}</span>
                              </Box>
                              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Total:</span>
                                <span>{usage.total_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: '0.85em' }}>
                                <span>Calls:</span>
                                <span>{usage.calls}</span>
                              </Box>
                              {modelCount > 1 && <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />}
                            </Box>
                          ))}
                          {modelCount > 1 && (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ mb: 0.5 }}>Overall Usage:</Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Prompt:</span>
                                <span>{overall.prompt_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Completion:</span>
                                <span>{overall.completion_tokens.toLocaleString()}</span>
                              </Box>
                              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Total:</span>
                                <span>{overall.total_tokens.toLocaleString()}</span>
                              </Box>
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'default' }}>
                  <IconPlaystationCircle size={20} style={{ color: theme.palette.warning.main }} />
                  <Typography variant="body2">
                    {calculateMetrics().tokens.toLocaleString()}
                  </Typography>
                </Stack>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconClock size={20} style={{ color: theme.palette.info.main }} />
              <Typography variant="body2">
                {(calculateMetrics().totalLatency / 1000).toFixed(1)}s
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={isRawView ? "Switch to formatted view" : "Switch to raw view"}>
              <IconButton
                size="small"
                onClick={() => setIsRawView(!isRawView)}
                sx={{
                  color: isRawView ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {isRawView ? <IconAbc size={20} /> : <IconCode size={20} />}
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              <IconDotsVertical size={20} />
            </IconButton>
          </Stack>
        </Box>
      )}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Fade in={fadeIn} timeout={300}>
          <Box sx={{ height: '100%' }}>
            <Scrollbar
              sx={{
                height: '100%',
                '& .simplebar-content': {
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {sortedMessages.map((message, index) => 
                renderMessage(message, index, sortedMessages)
              )}
              {isProcessing && renderLoadingMessage()}
              {!activeThread && !isProcessing && (
                <Box sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 'calc(100vh - 200px)'
                }}>
                  <Typography variant="h5" gutterBottom>
                    Welcome to Tyler Chat
                  </Typography>
                  <Typography color="textSecondary">
                    Start a new conversation by typing a message below
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Scrollbar>
          </Box>
        </Fade>
      </Box>

      <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.default' }}>
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              border: '2px dashed',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="h6" color="primary">
              Drop files here
            </Typography>
          </Box>
        )}
        
        <Stack direction="row" alignItems="flex-end">
          <Box sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}>
            <Box sx={{ 
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                variant="outlined"
                size="small"
                disabled={isProcessing}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderRadius: '8px 8px 0 0',
                    padding: '12px',
                  }
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 1.5,
                py: 0.5
              }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <IconPaperclip size={20} />
                  </IconButton>
                  {attachments.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => handleRemoveAttachment(index)}
                          deleteIcon={<IconX size={14} />}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                            color: 'text.primary',
                            '& .MuiChip-deleteIcon': {
                              color: 'text.secondary',
                              '&:hover': {
                                color: 'error.main',
                              },
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && attachments.length === 0) || isProcessing}
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      color: 'primary.dark',
                    },
                    '&.Mui-disabled': {
                      color: 'text.disabled',
                    }
                  }}
                >
                  <IconSend size={18} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>
      <FilePreviewModal />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={handleDeleteClick}
          sx={{ 
            gap: 1
          }}
        >
          <IconTrash size={18} style={{ color: theme.palette.error.main }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatContent; 