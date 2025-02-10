import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, Divider, Menu, MenuItem, useTheme } from '@mui/material';
import { 
  IconMessage, 
  IconTool, 
  IconPlaystationCircle, 
  IconClock,
  IconDotsVertical,
  IconTrash
} from '@tabler/icons-react';
import { Thread } from '@/types/chat';

interface ChatHeaderProps {
  thread: Thread;
  onDeleteThread: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  thread,
  onDeleteThread,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const calculateMetrics = () => {
    if (!thread) return { messages: 0, tools: 0, tokens: 0, totalLatency: 0 };
    
    const messageCount = thread.messages.length;
    
    // Calculate tool usage
    const toolCalls = thread.messages.reduce((count, msg) => 
      count + (msg.tool_calls?.length || 0), 0);
    
    // Calculate total tokens
    const totalTokens = thread.messages.reduce((total, msg) => 
      total + (msg.metrics?.usage?.total_tokens || 0), 0);

    // Calculate total latency
    const totalLatency = thread.messages.reduce((total, msg) => 
      total + (msg.metrics?.timing?.latency || 0), 0);

    return { 
      messages: messageCount, 
      tools: toolCalls, 
      tokens: totalTokens,
      totalLatency
    };
  };

  const calculateToolUsage = () => {
    if (!thread) return { tools: {}, total_calls: 0 };
    
    const toolCounts: Record<string, number> = {};
    let totalCalls = 0;
    
    for (const message of thread.messages) {
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

  const calculateTokenUsage = () => {
    if (!thread) return { overall: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }, modelUsage: {} };
    
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
    
    for (const message of thread.messages) {
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

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    onDeleteThread();
    handleMenuClose();
  };

  const metrics = calculateMetrics();
  const { tools, total_calls } = calculateToolUsage();
  const { overall, modelUsage } = calculateTokenUsage();

  return (
    <Box sx={{ 
      p: 3, 
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <IconMessage size={20} style={{ color: theme.palette.primary.main }} />
          <Typography variant="body2">
            {metrics.messages}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip
            title={
              <Box sx={{ p: 1, fontFamily: 'monospace' }}>
                <Box sx={{ color: 'primary.light', mb: 0.5 }}>Tool Usage:</Box>
                {Object.entries(tools).map(([toolName, count]) => (
                  <Box key={toolName} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                    <span>{toolName}:</span>
                    <span>{count}</span>
                  </Box>
                ))}
                {Object.keys(tools).length > 1 && (
                  <>
                    <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Total:</span>
                      <span>{total_calls}</span>
                    </Box>
                  </>
                )}
                {Object.keys(tools).length === 0 && (
                  <Box sx={{ color: 'grey.100' }}>No tools used</Box>
                )}
              </Box>
            }
            arrow
            placement="top"
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'default' }}>
              <IconTool size={20} style={{ color: theme.palette.secondary.main }} />
              <Typography variant="body2">
                {metrics.tools}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip
            title={
              <Box sx={{ p: 1, fontFamily: 'monospace' }}>
                <Box sx={{ color: 'primary.light', mb: 0.5 }}>Token Usage by Model:</Box>
                {Object.entries(modelUsage).map(([model, usage]) => (
                  <Box key={model}>
                    <Box sx={{ color: 'primary.light', mt: 1, mb: 0.5 }}>
                      {model}:
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Prompt:</span>
                      <span>{usage.prompt_tokens.toLocaleString()}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Completion:</span>
                      <span>{usage.completion_tokens.toLocaleString()}</span>
                    </Box>
                    <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Total:</span>
                      <span>{usage.total_tokens.toLocaleString()}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100', fontSize: '0.85em' }}>
                      <span>Calls:</span>
                      <span>{usage.calls}</span>
                    </Box>
                  </Box>
                ))}
                {Object.keys(modelUsage).length > 1 && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ color: 'primary.light', mb: 0.5 }}>Overall Usage:</Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Prompt:</span>
                      <span>{overall.prompt_tokens.toLocaleString()}</span>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Completion:</span>
                      <span>{overall.completion_tokens.toLocaleString()}</span>
                    </Box>
                    <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, color: 'grey.100' }}>
                      <span>Total:</span>
                      <span>{overall.total_tokens.toLocaleString()}</span>
                    </Box>
                  </Box>
                )}
              </Box>
            }
            arrow
            placement="top"
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'default' }}>
              <IconPlaystationCircle size={20} style={{ color: theme.palette.warning.main }} />
              <Typography variant="body2">
                {metrics.tokens.toLocaleString()}
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconClock size={20} style={{ color: theme.palette.info.main }} />
          <Typography variant="body2">
            {(metrics.totalLatency / 1000).toFixed(1)}s
          </Typography>
        </Stack>
      </Stack>
      <IconButton 
        onClick={handleMenuClick}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'text.primary',
          },
        }}
      >
        <IconDotsVertical size={20} />
      </IconButton>
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

export default ChatHeader; 