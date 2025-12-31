import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Checkbox,
  FormControlLabel,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  FilterList,
  ClearAll,
  ExpandMore,
  ExpandLess,
  DateRange,
  LocationOn,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { CATEGORIES, LOCATIONS } from '../../utils/constants';

interface FilterOptions {
  categories: string[];
  locations: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: string[];
  hasReward: boolean | null;
}

interface FilterPanelProps {
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  defaultFilters?: Partial<FilterOptions>;
  availableCategories?: string[];
  availableLocations?: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  defaultFilters = {},
  availableCategories = CATEGORIES,
  availableLocations = LOCATIONS,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: defaultFilters.categories || [],
    locations: defaultFilters.locations || [],
    dateRange: defaultFilters.dateRange || { start: null, end: null },
    status: defaultFilters.status || [],
    hasReward: defaultFilters.hasReward || null,
  });

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationChange = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    
    const newFilters = { ...filters, locations: newLocations };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...filters.dateRange,
      [type]: value ? new Date(value) : null,
    };
    
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRewardChange = (hasReward: boolean | null) => {
    const newFilters = { ...filters, hasReward };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      locations: [],
      dateRange: { start: null, end: null },
      status: [],
      hasReward: null,
    };
    
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = [
    filters.categories.length,
    filters.locations.length,
    filters.status.length,
    filters.dateRange.start ? 1 : 0,
    filters.dateRange.end ? 1 : 0,
    filters.hasReward !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // Supabase status values
  const statusOptions = ['active', 'claimed', 'resolved', 'closed'];

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              color="primary"
              size="small"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearAll />}
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}
          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.categories.map(category => (
            <Chip
              key={category}
              label={`Category: ${category}`}
              onDelete={() => handleCategoryChange(category)}
              size="small"
            />
          ))}
          {filters.locations.map(location => (
            <Chip
              key={location}
              label={`Location: ${location}`}
              onDelete={() => handleLocationChange(location)}
              size="small"
            />
          ))}
          {filters.status.map(status => (
            <Chip
              key={status}
              label={`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
              onDelete={() => handleStatusChange(status)}
              size="small"
            />
          ))}
          {filters.hasReward !== null && (
            <Chip
              label={`Reward: ${filters.hasReward ? 'Yes' : 'No'}`}
              onDelete={() => handleRewardChange(null)}
              size="small"
            />
          )}
        </Box>
      )}

      <Collapse in={isExpanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Categories */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon fontSize="small" />
              Categories
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableCategories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  clickable
                  color={filters.categories.includes(category) ? 'primary' : 'default'}
                  variant={filters.categories.includes(category) ? 'filled' : 'outlined'}
                  onClick={() => handleCategoryChange(category)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Locations */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn fontSize="small" />
              Locations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableLocations.map(location => (
                <Chip
                  key={location}
                  label={location}
                  clickable
                  color={filters.locations.includes(location) ? 'primary' : 'default'}
                  variant={filters.locations.includes(location) ? 'filled' : 'outlined'}
                  onClick={() => handleLocationChange(location)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRange fontSize="small" />
              Date Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="From"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </Box>
          </Box>

          <Divider />

          {/* Status - Updated for Supabase */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Status
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {statusOptions.map(status => (
                <Chip
                  key={status}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  clickable
                  color={filters.status.includes(status) ? 'primary' : 'default'}
                  variant={filters.status.includes(status) ? 'filled' : 'outlined'}
                  onClick={() => handleStatusChange(status)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Reward */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Reward Offered
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="Yes"
                clickable
                color={filters.hasReward === true ? 'primary' : 'default'}
                variant={filters.hasReward === true ? 'filled' : 'outlined'}
                onClick={() => handleRewardChange(filters.hasReward === true ? null : true)}
                size="small"
              />
              <Chip
                label="No"
                clickable
                color={filters.hasReward === false ? 'primary' : 'default'}
                variant={filters.hasReward === false ? 'filled' : 'outlined'}
                onClick={() => handleRewardChange(filters.hasReward === false ? null : false)}
                size="small"
              />
              <Chip
                label="Any"
                clickable
                color={filters.hasReward === null ? 'primary' : 'default'}
                variant={filters.hasReward === null ? 'filled' : 'outlined'}
                onClick={() => handleRewardChange(null)}
                size="small"
              />
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FilterPanel;
