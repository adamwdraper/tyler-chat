import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, TextContent, ImageContent, MessageAttachment } from '@/types/chat';

interface MessageContentProps {
  content: string | (TextContent | ImageContent)[];
  role: string;
  message: Message;
  messages: Message[];
  isPlainText: boolean;
  onAttachmentClick: (attachment: MessageAttachment) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  content,
  role,
  message,
  messages,
  isPlainText,
  onAttachmentClick,
}) => {
  const renderFormattedCode = (data: any, functionName?: string) => {
    return (
      <Box
        component="pre"
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
          borderRadius: 1,
          border: 1,
          borderColor: theme => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
        }}
      >
        {functionName && (
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
              Result
            </Box>
            <Box component="span" sx={{ color: 'secondary.main', fontWeight: 600 }}>
              {functionName}
            </Box>
          </Stack>
        )}
        {JSON.stringify(data, null, 2)}
      </Box>
    );
  };

  const renderMarkdown = (text: string) => {
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
        {text}
      </ReactMarkdown>
    );
  };

  if (typeof content === 'string') {
    if (role === 'tool') {
      try {
        const parsedContent = JSON.parse(content);
        return renderFormattedCode(parsedContent, message.name);
      } catch {
        return renderFormattedCode(content, message.name);
      }
    }
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

  return (
    <Stack spacing={2}>
      {content.map((item, index) => {
        if (item.type === 'text') {
          if (role === 'tool') {
            return renderFormattedCode(item.text, message.name);
          }
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
                const attachment: MessageAttachment = {
                  filename: 'image.png',
                  mime_type: 'image/png',
                  processed_content: {
                    type: 'image',
                    url: item.image_url.url,
                    content: item.image_url.url
                  }
                };
                onAttachmentClick(attachment);
              }}
            >
              <img 
                src={item.image_url.url} 
                alt="Message content" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  maxHeight: 300,
                  borderRadius: 4
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

export default MessageContent; 