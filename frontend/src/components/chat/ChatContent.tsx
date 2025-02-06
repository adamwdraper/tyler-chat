import React, { useRef, useEffect } from 'react';
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

const ChatContent: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [expandedMessages, setExpandedMessages] = React.useState<Set<string>>(new Set());
  const [contentHeights, setContentHeights] = React.useState<Map<string, number>>(new Map());
  const contentRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const maxHeight = 200; // About 10 lines of text
  
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

  const renderMessage = (message: Message, index: number, messages: Message[]) => {
    const isAI = message.role === 'assistant';
    const isSystem = message.role === 'system';
    const isTool = message.role === 'tool';
    const isExpanded = expandedMessages.has(message.id);
    const contentHeight = contentHeights.get(message.id) || 0;
    const shouldShowExpand = contentHeight > maxHeight;

    // Skip tool responses as they'll be rendered with their calls
    if (isTool && message.tool_call_id) {
      return null;
    }
    
    return (
      <Box key={message.id}>
        <Box p={3}>
          <Stack direction="row" gap="10px" mb={2}>
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
                  <Typography 
                    variant="body1" 
                    sx={{ lineHeight: 1.5 }}
                    ref={el => {
                      if (el) {
                        contentRefs.current.set(message.id, el);
                      }
                    }}
                  >
                    {message.content}
                  </Typography>
                  {!isExpanded && shouldShowExpand && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '100px',
                        background: theme.palette.mode === 'dark' 
                          ? 'linear-gradient(180deg, transparent, rgba(33,33,33,0.9) 70%)'
                          : 'linear-gradient(180deg, transparent, rgba(255,255,255,0.9) 70%)',
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
                        sx={{ mb: 1 }}
                      >
                        Show More
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
                    Show Less
                  </Button>
                </Box>
              )}

              {/* Tool calls with their results */}
              {message.tool_calls && message.tool_calls.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    {message.tool_calls.map((call: ToolCall) => {
                      // Find the corresponding tool response
                      const toolResponse = messages.find(m => 
                        m.role === 'tool' && 
                        m.tool_call_id === call.id
                      );

                      return (
                        <Paper
                          key={call.id}
                          variant="outlined"
                          sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                            fontFamily: 'monospace',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Tool Call */}
                          <Box sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: 'primary.main',
                                  fontWeight: 600
                                }}
                              >
                                {call.function.name}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: 'text.secondary'
                                }}
                              >
                                (
                              </Typography>
                            </Box>
                            <Box sx={{ ml: 2 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  whiteSpace: 'pre-wrap',
                                  color: 'text.secondary'
                                }}
                              >
                                {(() => {
                                  try {
                                    const args = JSON.parse(call.function.arguments);
                                    return JSON.stringify(args, null, 2);
                                  } catch {
                                    return call.function.arguments;
                                  }
                                })()}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace',
                                color: 'text.secondary'
                              }}
                            >
                              );
                            </Typography>
                          </Box>

                          {/* Tool Response */}
                          {toolResponse && (
                            <>
                              <Divider />
                              <Box 
                                sx={{ 
                                  p: 2,
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    color: 'text.secondary'
                                  }}
                                >
                                  {toolResponse.content}
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Paper>
                      );
                    })}
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
        <Divider />
      </Box>
    );
  };

  const renderLoadingMessage = () => (
    <Box>
      <Box p={3}>
        <Stack direction="row" gap="10px" alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              color: 'white'
            }}
          >
            <IconRobot size={24} />
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Tyler AI
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Thinking...
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ pl: 7, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="textSecondary">
            Generating response...
          </Typography>
        </Box>
      </Box>
      <Divider />
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