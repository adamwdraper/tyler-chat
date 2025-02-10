import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Button, IconButton, Modal, Fade, Alert, CircularProgress } from '@mui/material';
import { IconX, IconPaperclip } from '@tabler/icons-react';
import { MessageAttachment } from '@/types/chat';

interface FilePreviewModalProps {
  attachment: MessageAttachment | null;
  onClose: () => void;
  containerId?: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  attachment,
  onClose,
  containerId = 'chat-content-container',
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attachment?.mime_type?.startsWith('text/')) {
      const fileUrl = getFileUrl(attachment);
      if (fileUrl) {
        fetch(fileUrl)
          .then(response => response.text())
          .then(text => setContent(text))
          .catch(err => {
            console.error('Error fetching text content:', err);
            setError('Failed to load file content');
          });
      }
    }
  }, [attachment]);

  if (!attachment) return null;

  const getFileUrl = (attachment: MessageAttachment) => {
    // If we have a storage path, construct the URL to the actual file
    if (attachment.storage_path) {
      return `/files/${attachment.storage_path}`;
    }
    // If we have a URL in processed content, use that directly
    if (attachment.processed_content?.url) {
      return attachment.processed_content.url;
    }
    // If we have content in processed content, use that directly
    if (attachment.processed_content?.content) {
      return attachment.processed_content.content;
    }
    // Fallback to base64 content if available
    if (attachment.content) {
      return `data:${attachment.mime_type || 'application/octet-stream'};base64,${attachment.content}`;
    }
    return null;
  };

  const renderContent = () => {
    const fileUrl = getFileUrl(attachment);
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
    if (attachment.mime_type === 'application/pdf') {
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
              title={attachment.filename}
            />
          </object>
        </Box>
      );
    }

    // Handle images
    if (attachment.mime_type?.startsWith('image/')) {
      return (
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
              display: 'block',
              margin: '0 auto',
              borderRadius: 4
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
      attachment.mime_type === 'text/plain' ||
      attachment.mime_type === 'text/csv' ||
      attachment.mime_type === 'application/json'
    ) {
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
          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
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
            download={attachment.filename}
            startIcon={<IconPaperclip size={20} />}
          >
            Download {attachment.filename}
          </Button>
        </Box>
      </Stack>
    );
  };

  return (
    <Modal
      open={!!attachment}
      onClose={onClose}
      aria-labelledby="file-preview-modal"
      closeAfterTransition
      sx={{
        position: 'absolute',
        '& .MuiBackdrop-root': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
          position: 'absolute'
        }
      }}
      container={() => document.getElementById(containerId)}
    >
      <Fade in={true}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
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
              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" component="h2">
                {attachment.filename}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {attachment.mime_type}
              </Typography>
            </Stack>
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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

export default FilePreviewModal; 