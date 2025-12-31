import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  MoreVert,
  LocationOn,
  Schedule,
  Person,
  Category as CategoryIcon,
  CheckCircle,
  Pending,
  Warning,
  Close,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Case } from '../../types';
import { formatDate, getCategoryColor } from '../../utils/helpers';

interface CaseCardProps {
  caseItem: Case;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  compact?: boolean;
  userName?: string; // Add userName as optional prop since it's not in cases table
}

const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  showActions = true,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  userName, // Receive userName from parent
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit(caseItem.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete(caseItem.id);
  };

  const handleStatusChange = (newStatus: string) => {
    handleMenuClose();
    if (onStatusChange) onStatusChange(caseItem.id, newStatus);
  };

  const statusConfig = {
    active: { icon: <Pending color="warning" />, color: 'warning', label: 'Active' },
    claimed: { icon: <Warning color="info" />, color: 'info', label: 'Claimed' },
    resolved: { icon: <CheckCircle color="success" />, color: 'success', label: 'Resolved' },
    closed: { icon: <Close color="inherit" />, color: 'default', label: 'Closed' },
  };

  const status = statusConfig[caseItem.status as keyof typeof statusConfig] || statusConfig.active;

  if (compact) {
    return (
      <Card
        component={RouterLink}
        to={`/case/${caseItem.id}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          textDecoration: 'none',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        {caseItem.image_url && (
          <CardMedia
            component="img"
            height="140"
            image={caseItem.image_url}
            alt={caseItem.title}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="subtitle1" component="h3" noWrap sx={{ flex: 1, fontWeight: 600 }}>
              {caseItem.title}
            </Typography>
            {showActions && (
              <IconButton size="small" onClick={handleMenuClick} sx={{ ml: 1 }}>
                <MoreVert fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            <Chip
              icon={status.icon}
              label={status.label}
              size="small"
              color={status.color as any}
              variant="outlined"
            />
            <Chip
              label={caseItem.type}
              size="small"
              color={caseItem.type === 'lost' ? 'error' : 'success'}
              variant="outlined"
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
            }}
          >
            {caseItem.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <CategoryIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              {caseItem.category}
            </Typography>
          </Box>

          <Box sx={{ display: '-flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <LocationOn fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              {caseItem.location}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(caseItem.created_at)}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            component={RouterLink}
            to={`/case/${caseItem.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            View Details
          </Button>
        </CardActions>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleEdit}>Edit Case</MenuItem>
          {onStatusChange && (
            <MenuItem onClick={() => handleStatusChange(caseItem.status === 'active' ? 'resolved' : 'active')}>
              Mark as {caseItem.status === 'active' ? 'Resolved' : 'Active'}
            </MenuItem>
          )}
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            Delete Case
          </MenuItem>
        </Menu>
      </Card>
    );
  }

  // Full version
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        height: '100%',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      {caseItem.image_url && (
        <Box sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0 }}>
          <CardMedia
            component="img"
            height="100%"
            image={caseItem.image_url}
            alt={caseItem.title}
            sx={{ objectFit: 'cover', height: { xs: 200, sm: '100%' } }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                {caseItem.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={status.icon}
                  label={status.label}
                  size="small"
                  color={status.color as any}
                />
                <Chip
                  label={caseItem.type.toUpperCase()}
                  size="small"
                  color={caseItem.type === 'lost' ? 'error' : 'success'}
                  variant="outlined"
                />
                <Chip
                  label={caseItem.category}
                  size="small"
                  sx={{ backgroundColor: getCategoryColor(caseItem.category) + '20', color: getCategoryColor(caseItem.category) }}
                />
              </Box>
            </Box>
            {showActions && (
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            )}
          </Box>

          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 3,
            }}
          >
            {caseItem.description}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn color="action" />
              <Typography variant="body2" color="text.secondary">
                {caseItem.location}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDate(caseItem.created_at)}
              </Typography>
            </Box>
            {userName && ( // Conditionally render userName if provided
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="action" />
                <Typography variant="body2" color="text.secondary">
                  {userName}
                </Typography>
              </Box>
            )}
          </Box>

          {/* REMOVED REWARD SECTION since it doesn't exist in your database */}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            component={RouterLink}
            to={`/case/${caseItem.id}`}
          >
            View Details
          </Button>
          {userName && ( // Conditionally render user info if userName is provided
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {userName[0] || 'U'}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Reported by {userName}
              </Typography>
            </Box>
          )}
        </CardActions>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem component={RouterLink} to={`/case/${caseItem.id}`} onClick={handleMenuClose}>
          View Details
        </MenuItem>
        <MenuItem component={RouterLink} to={`/edit-case/${caseItem.id}`} onClick={handleMenuClose}>
          Edit Case
        </MenuItem>
        {onStatusChange && (
          <MenuItem onClick={() => handleStatusChange(caseItem.status === 'active' ? 'resolved' : 'active')}>
            Mark as {caseItem.status === 'active' ? 'Resolved' : 'Active'}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            Delete Case
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default CaseCard;
