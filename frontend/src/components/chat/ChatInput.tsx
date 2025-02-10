import React, { useRef, useState } from 'react';
import { Box, Stack, TextField, IconButton, Chip } from '@mui/material';
import { IconSend, IconPaperclip, IconX } from '@tabler/icons-react';

// Constants for file validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
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

interface ChatInputProps {
  onSendMessage: (message: string, attachments: File[]) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return `File type ${file.type || 'unknown'} is not supported for ${file.name}`;
    }
    return null;
  };

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
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
    }

    setAttachments(prev => [...prev, ...validFiles]);
    if (event.target) {
      event.target.value = ''; // Reset input
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    onSendMessage(newMessage, attachments);
    setNewMessage('');
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
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
                onClick={handleSend}
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple
        accept={Array.from(ALLOWED_MIME_TYPES).join(',')}
      />
    </Box>
  );
};

export default ChatInput; 