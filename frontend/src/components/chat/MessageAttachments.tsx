import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { IconPaperclip } from '@tabler/icons-react';
import { MessageAttachment } from '@/types/chat';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  onAttachmentClick: (attachment: MessageAttachment) => void;
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onAttachmentClick,
}) => {
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

  if (!attachments || attachments.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        {attachments.map((attachment, index) => {
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
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onAttachmentClick(attachment)}
              >
                {imageUrl ? (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={imageUrl}
                      alt={attachment.filename}
                      style={{ 
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: 300,
                        display: 'block',
                        margin: '0 auto',
                        borderRadius: 4
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', {
                          src: imageUrl,
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
          
          return (
            <Chip
              key={index}
              label={attachment.filename}
              variant="outlined"
              size="medium"
              icon={<IconPaperclip size={16} />}
              onClick={() => onAttachmentClick(attachment)}
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
  );
};

export default MessageAttachments; 