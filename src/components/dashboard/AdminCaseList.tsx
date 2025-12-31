import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Pending,
  Warning,
  Close,
  FilterList,
} from '@mui/icons-material';
import { Case } from '../../types';
import { formatDate } from '../../utils/helpers';

// Extended Case type that includes user info
interface CaseWithUser extends Case {
  user_name?: string;
  user_email?: string;
}

interface AdminCaseListProps {
  cases: CaseWithUser[]; // Changed to CaseWithUser
  onView: (caseId: string) => void;
  onEdit: (caseId: string) => void;
  onDelete: (caseId: string) => void;
  onStatusChange: (caseId: string, newStatus: string) => void;
  isLoading?: boolean;
}

const AdminCaseList: React.FC<AdminCaseListProps> = ({
  cases,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, caseId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCaseId(caseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCaseId(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter and search cases
  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = searchTerm === '' || 
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginate cases
  const paginatedCases = filteredCases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Supabase status values
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Pending fontSize="small" />;
      case 'claimed':
        return <Warning fontSize="small" />;
      case 'resolved':
        return <CheckCircle fontSize="small" />;
      case 'closed':
        return <Close fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'warning';
      case 'claimed':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'lost' ? 'error' : 'success';
  };

  // Status options for filtering (Supabase values)
  const statusOptions = ['all', 'active', 'claimed', 'resolved', 'closed'];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'claimed': return 'Claimed';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      case 'all': return 'All Cases';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Table Header with Search and Filters */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search cases..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`Total: ${cases.length}`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Filtered: ${filteredCases.length}`}
            size="small"
          />
        </Box>
      </Box>

      {/* Status Filter Chips */}
      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {statusOptions.map((status) => (
          <Chip
            key={status}
            label={getStatusLabel(status)}
            clickable
            color={statusFilter === status ? 'primary' : 'default'}
            variant={statusFilter === status ? 'filled' : 'outlined'}
            onClick={() => setStatusFilter(status)}
            size="small"
            icon={status === 'all' ? <FilterList fontSize="small" /> : getStatusIcon(status)}
          />
        ))}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography>Loading cases...</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No cases found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCases.map((caseItem) => (
                <TableRow
                  key={caseItem.id}
                  hover
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {caseItem.id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={caseItem.title}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {caseItem.title}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={caseItem.type}
                      size="small"
                      color={getTypeColor(caseItem.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(caseItem.status)}
                      label={getStatusLabel(caseItem.status)}
                      size="small"
                      color={getStatusColor(caseItem.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{caseItem.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{caseItem.user_name || 'Anonymous'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {caseItem.user_email || 'No email'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(caseItem.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, caseItem.id)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredCases.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedCaseId) onView(selectedCaseId);
          handleMenuClose();
        }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCaseId) onEdit(selectedCaseId);
          handleMenuClose();
        }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Case
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCaseId) {
            const currentCase = cases.find(c => c.id === selectedCaseId);
            if (currentCase) {
              const newStatus = currentCase.status === 'active' ? 'resolved' : 'active';
              onStatusChange(selectedCaseId, newStatus);
            }
          }
          handleMenuClose();
        }}>
          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
          {(() => {
            const currentCase = cases.find(c => c.id === selectedCaseId);
            if (!currentCase) return 'Toggle Status';
            return currentCase.status === 'active' ? 'Mark as Resolved' : 'Mark as Active';
          })()}
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedCaseId) onDelete(selectedCaseId);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Case
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default AdminCaseList;
