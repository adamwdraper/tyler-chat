import React, { useRef, useEffect } from 'react';
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
} from '@mui/material';
import { 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconCode,
  IconDots,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { addMessage, processThread, createThread } from '@/store/chat/ChatSlice';
import { RootState } from '@/store/Store';
import { Message, Thread, ToolCall } from '@/types/chat';
import Scrollbar from '@/components/custom-scroll/Scrollbar';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

const dotAnimation = keyframes`
  0%, 20% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-2px);
  }
  80%, 100% {
    opacity: 0.2;
    transform: translateY(0);
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
  const contentRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const maxHeight = 300; // About 15 lines of text
  
  const { threads, currentThread } = useSelector((state: RootState) => state.chat);
  const activeThread = threads.find((t: Thread) => t.id === currentThread);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let threadId = currentThread;
    
    // If no active thread, create one first
    if (!threadId) {
      const newThread = await dispatch(createThread({ title: 'New Chat' })).unwrap();
      threadId = newThread.id;
    }

    if (!threadId) return; // Safety check

    await dispatch(addMessage({
      threadId,
      message: {
        role: 'user',
        content: newMessage
      }
    }));

    setNewMessage('');
    setIsProcessing(true);
    
    try {
      await dispatch(processThread(threadId));
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

  const renderContent = (content: string, role: string, message: Message, messages: Message[]) => {
    // Always render tool results in code container
    if (role === 'tool') {
      try {
        // Try to parse as JSON first, then as Python dict
        let data;
        if (isJsonString(content)) {
          data = JSON.parse(content);
        } else if (isPythonDictString(content)) {
          data = formatPythonDict(content);
        } else {
          // If it's not recognized as either, but starts with a curly brace, try to format it
          const trimmed = content.trim();
          if (trimmed.startsWith('{')) {
            try {
              data = formatPythonDict(content);
            } catch {
              data = content;
            }
          } else {
            data = content;
          }
        }
        
        // Find the corresponding tool call from the previous assistant message
        let functionName = '';
        if (message.tool_call_id) {
          const assistantMessage = messages.find(m => 
            m.role === 'assistant' && 
            m.tool_calls?.some(call => call.id === message.tool_call_id)
          );
          if (assistantMessage) {
            const toolCall = assistantMessage.tool_calls?.find(call => call.id === message.tool_call_id);
            functionName = toolCall?.function.name || '';
          }
        }
        
        return renderFormattedCode(data, functionName);
      } catch (e) {
        // Fallback to rendering the raw content in code container
        return renderFormattedCode(content);
      }
    }

    if (isJsonString(content)) {
      try {
        const data = JSON.parse(content);
        return renderFormattedCode(data);
      } catch (e) {
        // Fallback to markdown
        return renderMarkdown(content);
      }
    } else if (isPythonDictString(content)) {
      try {
        const data = formatPythonDict(content);
        return renderFormattedCode(data);
      } catch (e) {
        // Fallback to markdown
        return renderMarkdown(content);
      }
    }

    // Regular markdown for non-JSON/Python content
    return renderMarkdown(content);
  };

  const renderMessage = (message: Message, index: number, messages: Message[]) => {
    const isAI = message.role === 'assistant';
    const isSystem = message.role === 'system';
    const isTool = message.role === 'tool';
    const isExpanded = expandedMessages.has(message.id);
    const contentHeight = contentHeights.get(message.id) || 0;
    const shouldShowExpand = contentHeight > maxHeight;
    const isLastMessage = index === messages.length - 1;

    // Skip tool responses as they'll be rendered with their calls
    if (isTool && !message.tool_call_id) {
      return null;
    }
    
    return (
      <Box key={message.id}>
        <Box p={3} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 1000 }}>
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
                    <Typography variant="subtitle2" gutterBottom>
                      Attachments ({message.attachments.length})
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {message.attachments.map((attachment, index) => (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Typography variant="body2">
                            {attachment.filename}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Timestamp - moved to end */}
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ 
                    display: 'block',
                    textAlign: 'right',
                    mt: 1
                  }}
                >
                  {message.timestamp ? formatDistanceToNowStrict(parseISO(message.timestamp), {
                    addSuffix: true,
                  }) : ''}
                </Typography>
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {activeThread && (
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">
            {activeThread.title || 'Untitled Chat'}
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Scrollbar>
          {activeThread?.messages.map((message, index, messages) => 
            renderMessage(message, index, messages)
          )}
          {isProcessing && renderLoadingMessage()}
          {!activeThread && !isProcessing && (
            <Box textAlign="center" py={8}>
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

      <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.default' }}>
        <Stack direction="row" spacing={2}>
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
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isProcessing}
            sx={{
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <IconSend size={18} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatContent; 