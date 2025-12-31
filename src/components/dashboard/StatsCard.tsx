import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  InfoOutlined,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
  subtitle?: string;
  description?: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  progress,
  subtitle,
  description,
  onClick,
}) => {
  const colorMap = {
    primary: '#1976d2',
    secondary: '#9c27b0',
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
  };

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight={700}>
              {value}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${colorMap[color]}15`,
              color: colorMap[color],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        
        {/* Trend Indicator */}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
            {trend.isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              sx={{ color: trend.isPositive ? 'success.main' : 'error.main' }}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              from last month
            </Typography>
          </Box>
        )}
        
        {/* Progress Bar */}
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: `${colorMap[color]}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: colorMap[color],
                },
              }}
            />
          </Box>
        )}
        
        {/* Description with Info */}
        {description && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            <Tooltip title={description}>
              <InfoOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
