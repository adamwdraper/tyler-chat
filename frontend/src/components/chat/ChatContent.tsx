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
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { addMessage, processThread, createThread, updateThread, deleteThread } from '@/store/chat/ChatSlice';
import { RootState } from '@/store/Store';
import { Message, Thread, ToolCall, TextContent, ImageContent, MessageCreate, MessageAttachment } from '@/types/chat';
import Scrollbar from '@/components/custom-scroll/Scrollbar';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useTimeAgoUpdater } from '@/hooks/useTimeAgoUpdater';

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

const ChatContent: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [contentHeights, setContentHeights] = React.useState<Map<string, number>>(new Map());
  const [isNewTitle, setIsNewTitle] = React.useState(false);
  const [fadeIn, setFadeIn] = React.useState(true);
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
  
  const { threads, currentThread } = useSelector((state: RootState) => state.chat);
  const activeThread = threads.find((t: Thread) => t.id === currentThread);

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

      console.log('Sending message with attachments:', {
        threadId,
        messageContent: newMessage,
        attachmentsCount: fileAttachments.length,
        attachmentDetails: fileAttachments.map(a => ({
          filename: a.filename,
          mime_type: a.mime_type
        }))
      });

      // Create message with the new structure
      const messageCreate: MessageCreate = {
        role: 'user',
        content: newMessage || '', // Ensure content is never undefined
        attributes: {},
        attachments: fileAttachments
      };

      const result = await dispatch(addMessage({
        threadId,
        message: messageCreate
      })).unwrap();

      console.log('Message sent successfully:', {
        threadId: result.id,
        messageCount: result.messages.length,
        lastMessage: result.messages[result.messages.length - 1]
      });

      setNewMessage('');
      setAttachments([]); // Clear attachments after sending
      
      await dispatch(processThread(threadId));
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
        return <IconRobot size={24} />;
      case 'system':
      case 'tool':
        return <IconCode size={24} />;
      default:
        return <IconUser size={24} />;
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

  const renderFormattedCode = (data: any, functionName?: string) => {
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
        {functionName ? (
          <>
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {functionName}
            </Box>
            {'\n\n'}
            {JSON.stringify(data, null, 2)}
          </>
        ) : (
          JSON.stringify(data, null, 2)
        )}
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
        return renderFormattedCode(content, message.name);
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
              return renderFormattedCode(item.text, message.name);
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
              <Box key={index} sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                <img 
                  src={item.image_url.url} 
                  alt="Message content" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
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
    if (typeof content === 'string') {
      return content.startsWith('data:') 
        ? content 
        : `data:${mimeType || 'image/*'};base64,${content}`;
    }
    if (content.content) {
      return `data:${content.mime_type || mimeType || 'image/*'};base64,${content.content}`;
    }
    if (content.url) return content.url;
    return undefined;
  };

  const renderMessage = (message: Message, index: number, messages: Message[]) => {
    const isAI = message.role === 'assistant';
    const isSystem = message.role === 'system';
    const isTool = message.role === 'tool';
    const isExpanded = expandedMessages.has(message.id);
    const contentHeight = contentHeights.get(message.id) || 0;
    const shouldShowExpand = contentHeight > maxHeight;
    const isLastMessage = index === messages.length - 1;
    const isHovered = hoveredMessageId === message.id;

    // Skip tool responses as they'll be rendered with their calls
    if (isTool && !message.tool_call_id) {
      return null;
    }
    
    // Add this right before the timestamp and metrics section
    const isToolRelated = message.role === 'tool' || message.tool_call_id;
    const isPlainText = plainTextMessages.has(message.id);

    return (
      <Box 
        key={message.id}
        onMouseEnter={() => setHoveredMessageId(message.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        <Box p={3} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 900 }}>
            <Stack direction="row" gap="16px" mb={2}>
              <Avatar
                sx={{
                  bgcolor: getMessageColor(message.role),
                  width: 40,
                  height: 40,
                  color: 'white',
                  alignSelf: 'flex-start'
                }}
              >
                {getMessageIcon(message.role)}
              </Avatar>
              <Box sx={{ flex: 1, mt: '10px' }}>
                {/* Message content with gradient fade */}
                {message.content && (
                  <Box
                    sx={{
                      position: 'relative',
                      maxHeight: isExpanded ? 'none' : maxHeight,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      ref={el => {
                        if (el) {
                          contentRefs.current.set(message.id, el as HTMLDivElement);
                        }
                      }}
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
                        '& ul, & ol': {
                          my: 0,
                          pl: 3,
                        },
                        '& li + li': {
                          mt: 0.5,
                        },
                        '& a': {
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        },
                        '& blockquote': {
                          borderLeft: 4,
                          borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
                          my: 1,
                          pl: 2,
                          ml: 0,
                          color: 'text.secondary',
                        },
                        '& table': {
                          borderCollapse: 'collapse',
                          width: '100%',
                          my: 2,
                        },
                        '& th, & td': {
                          border: 1,
                          borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300',
                          p: 1,
                        },
                        '& th': {
                          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      {renderContent(message.content, message.role, message, messages)}
                    </Box>
                    {!isExpanded && shouldShowExpand && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '110px',
                          background: theme.palette.mode === 'dark' 
                            ? 'linear-gradient(180deg, transparent 0%, rgba(33,33,33,0.8) 50%, rgba(33,33,33,0.95) 100%)'
                            : 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.95) 100%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          pt: 4
                        }}
                      >
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => toggleMessageExpand(message.id)}
                          startIcon={<IconChevronDown size={16} />}
                          sx={{ 
                            mb: 1,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.5)',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                            }
                          }}
                        >
                          More
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
                {isExpanded && shouldShowExpand && (
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
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

                {/* Tool calls */}
                {message.tool_calls && message.tool_calls.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                      {message.tool_calls.map((call) => (
                        <Paper
                          key={call.id}
                          variant="outlined"
                          sx={{
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                            fontFamily: 'monospace',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Tool Call */}
                          <Box sx={{ p: 2 }}>
                            <Box>
                              <Box
                                component="span"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {call.function.name}
                              </Box>
                              <Box
                                component="span"
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {(() => {
                                  try {
                                    const args = JSON.parse(call.function.arguments);
                                    return ` ({\n    ${Object.entries(args).map(([key, value]) => `"${key}": ${JSON.stringify(value)}`).join(',\n    ')}\n})`
                                  } catch {
                                    return ` (${call.function.arguments})`
                                  }
                                })()}
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {message.attachments.map((attachment, index) => {
                        const imageUrl = getImageUrl(attachment.processed_content, attachment.mime_type);
                        
                        if (attachment.mime_type?.startsWith('image/')) {
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
                                alignItems: 'center'
                              }}
                            >
                              {imageUrl ? (
                                <img 
                                  src={imageUrl}
                                  alt={attachment.filename}
                                  style={{ 
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    height: 'auto',
                                    display: 'block',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    console.error('Image failed to load:', {
                                      src: imageUrl,
                                      error: e
                                    });
                                  }}
                                />
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

                {/* Timestamp and Metrics */}
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mt: 1,
                    gap: 2,
                    color: 'text.secondary',
                    typography: 'caption',
                  }}
                >
                  <Fade in={isHovered}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconButton
                        onClick={() => handleCopyMessage(message)}
                        size="small"
                        sx={{ 
                          p: 0.5,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                          }
                        }}
                      >
                        {copiedMessageId === message.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </IconButton>
                      {!isToolRelated && (
                        <Tooltip title={isPlainText ? "Show as Markdown" : "Show as plain text"}>
                          <IconButton
                            onClick={() => toggleMessageFormat(message.id)}
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
                  {message.metrics && (
                    <>
                      {message.metrics.usage?.total_tokens > 0 && (
                        <Tooltip
                          title={
                            <Box sx={{ p: 1, fontFamily: 'monospace' }}>
                              <Box sx={{ color: 'primary.light', mb: 0.5 }}>
                                {message.metrics.model || 'Unknown Model'}:
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Prompt:</span>
                                <span>{message.metrics.usage.prompt_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Completion:</span>
                                <span>{message.metrics.usage.completion_tokens.toLocaleString()}</span>
                              </Box>
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'primary.light' }}>
                                <span>Total:</span>
                                <span>{message.metrics.usage.total_tokens.toLocaleString()}</span>
                              </Box>
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
                            <IconPlaystationCircle size={14} />
                            {message.metrics.usage.total_tokens.toLocaleString()}
                          </Box>
                        </Tooltip>
                      )}
                      {message.metrics?.timing?.latency > 0 && (
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconClock size={14} />
                          {(message.metrics.timing.latency / 1000).toFixed(2)}s
                        </Box>
                      )}
                    </>
                  )}
                  <Box component="span">
                    {message.timestamp ? formatTimeAgo(message.timestamp) : ''}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
        {!isLastMessage && <Divider />}
      </Box>
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
    if (!activeThread) return { messages: 0, tools: 0, tokens: 0 };
    
    const messageCount = activeThread.messages.length;
    
    // Calculate tool usage
    const toolCalls = activeThread.messages.reduce((count, msg) => 
      count + (msg.tool_calls?.length || 0), 0);
    
    // Calculate total tokens
    const totalTokens = activeThread.messages.reduce((total, msg) => 
      total + (msg.metrics?.usage?.total_tokens || 0), 0);

    return { 
      messages: messageCount, 
      tools: toolCalls, 
      tokens: totalTokens 
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

  const FilePreviewModal: React.FC = () => {
    if (!selectedAttachment) return null;

    const getFileUrl = (attachment: typeof selectedAttachment) => {
      // If we have a storage path, construct the URL to the actual file
      if (attachment.storage_path) {
        return `/files/${attachment.storage_path}`;
      }
      // Fallback to base64 content if available
      if (attachment.content) {
        return `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.content}`;
      }
      return null;
    };

    const renderContent = () => {
      if (!selectedAttachment.storage_path && !selectedAttachment.processed_content && !selectedAttachment.content) {
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Processing file...
            </Typography>
          </Box>
        );
      }

      const fileUrl = getFileUrl(selectedAttachment);

      // Handle images
      if (selectedAttachment.mime_type?.startsWith('image/')) {
        return fileUrl ? (
          <img 
            src={fileUrl}
            alt={selectedAttachment.filename}
            style={{ 
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto'
            }}
            onError={(e) => {
              console.error('Image failed to load:', {
                src: fileUrl,
                error: e
              });
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Unable to load image
          </Typography>
        );
      }

      // Handle PDFs and other documents that can be displayed in an iframe
      if (selectedAttachment.mime_type === 'application/pdf') {
        if (fileUrl) {
          return (
            <Box sx={{ 
              width: '100%',
              height: 'calc(90vh - 200px)',
              minHeight: '500px',
              overflow: 'hidden',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              <object
                data={fileUrl}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Unable to display PDF directly.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={fileUrl}
                    download={selectedAttachment.filename}
                    startIcon={<IconPaperclip size={20} />}
                  >
                    Download PDF
                  </Button>
                </Box>
              </object>
            </Box>
          );
        }
      }

      // Handle text files
      if (
        selectedAttachment.mime_type === 'text/plain' ||
        selectedAttachment.mime_type === 'text/csv' ||
        selectedAttachment.mime_type === 'application/json'
      ) {
        if (fileUrl) {
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
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              maxHeight: 'calc(90vh - 200px)',
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
      }
      
      // For all other files or when direct viewing is not possible
      return (
        <Stack spacing={2}>
          {fileUrl && (
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
          )}
          
          {/* Show processed content if available */}
          {selectedAttachment.processed_content?.overview && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Overview</Typography>
              <Typography variant="body2">{selectedAttachment.processed_content.overview}</Typography>
            </Box>
          )}
          
          {selectedAttachment.processed_content?.text && (
            <Box sx={{ 
              p: 3,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {selectedAttachment.processed_content.text}
            </Box>
          )}
          
          {selectedAttachment.processed_content?.analysis && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Analysis</Typography>
              <Stack spacing={1}>
                {selectedAttachment.processed_content.analysis.objects && (
                  <Typography variant="body2">
                    Objects detected: {selectedAttachment.processed_content.analysis.objects.join(', ')}
                  </Typography>
                )}
                {selectedAttachment.processed_content.analysis.text_detected && (
                  <Typography variant="body2">Text detected in file</Typography>
                )}
              </Stack>
            </Box>
          )}

          {selectedAttachment.processed_content?.error && (
            <Alert severity="error">
              {selectedAttachment.processed_content.error}
            </Alert>
          )}
        </Stack>
      );
    };

    return (
      <Modal
        open={!!selectedAttachment}
        onClose={handleCloseModal}
        aria-labelledby="file-preview-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '2%',  // Small margin from top
          left: '2%',  // Small margin from left
          right: '2%', // Small margin from right
          bottom: '2%', // Small margin from bottom
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          overflow: 'hidden', // Changed from 'auto' to 'hidden'
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" component="h2">
                  {selectedAttachment.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedAttachment.mime_type}
                </Typography>
              </Stack>
              <IconButton onClick={handleCloseModal} size="small">
                <IconX size={20} />
              </IconButton>
            </Stack>
            <Divider />
            <Box sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              minHeight: 0 // Important for proper flex behavior
            }}>
              {renderContent()}
            </Box>
          </Stack>
        </Box>
      </Modal>
    );
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={dropZoneRef}
    >
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
                  <Box sx={{ p: 1, fontFamily: 'monospace' }}>
                    {activeThread && (() => {
                      const { tools, total_calls } = calculateToolUsage();
                      const toolNames = Object.keys(tools);
                      
                      return (
                        <>
                          <Box sx={{ color: 'primary.light', mb: 0.5 }}>Tool Usage:</Box>
                          {toolNames.map((toolName) => (
                            <Box key={toolName} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <span>{toolName}:</span>
                              <span>{tools[toolName]}</span>
                            </Box>
                          ))}
                          {toolNames.length > 1 && (
                            <>
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'primary.light' }}>
                                <span>Total:</span>
                                <span>{total_calls}</span>
                              </Box>
                            </>
                          )}
                          {toolNames.length === 0 && (
                            <Box sx={{ color: 'text.secondary' }}>No tools used</Box>
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
                  <Box sx={{ p: 1, fontFamily: 'monospace' }}>
                    {activeThread && (() => {
                      const { modelUsage, overall } = calculateTokenUsage();
                      const modelCount = Object.keys(modelUsage).length;
                      
                      return (
                        <>
                          <Box sx={{ color: 'primary.light', mb: 0.5 }}>Token Usage by Model:</Box>
                          {Object.entries(modelUsage || {}).map(([model, usage]) => (
                            <Box key={model}>
                              <Box sx={{ color: 'primary.light', mt: 1, mb: 0.5 }}>
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
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Total:</span>
                                <span>{usage.total_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'text.secondary', fontSize: '0.85em' }}>
                                <span>Calls:</span>
                                <span>{usage.calls}</span>
                              </Box>
                              {modelCount > 1 && <Divider sx={{ my: 1 }} />}
                            </Box>
                          ))}
                          {modelCount > 1 && (
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ color: 'primary.light', mb: 0.5 }}>Overall Usage:</Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Prompt:</span>
                                <span>{overall.prompt_tokens.toLocaleString()}</span>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                <span>Completion:</span>
                                <span>{overall.completion_tokens.toLocaleString()}</span>
                              </Box>
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'primary.light' }}>
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
          </Stack>
          <Tooltip title="Delete thread">
            <IconButton 
              onClick={handleDeleteThread}
              size="small"
              color="error"
              sx={{
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white',
                },
              }}
            >
              <IconTrash size={20} />
            </IconButton>
          </Tooltip>
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple
          />
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
    </Box>
  );
};

export default ChatContent; 