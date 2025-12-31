import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Pagination,
  Alert,
} from '@mui/material';
import { Search, CheckCircle } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import CaseCard from '../components/cases/CaseCard';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import { Case, User } from '../types';

interface CaseWithUser extends Case {
  user_name?: string;
}

const FoundItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    locations: [] as string[],
    status: [] as string[],
  });
  const [page, setPage] = useState(1);
  const [cases, setCases] = useState<CaseWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 9;

  // Fetch found cases
  const fetchFoundCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('type', 'found')
        .order('created_at', { ascending: false });
      
      if (casesError) throw casesError;
      
      // Fetch user names for each case
      const casesWithUsers: CaseWithUser[] = await Promise.all(
        (casesData || []).map(async (caseItem) => {
          let userName = 'Anonymous';
          
          if (caseItem.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', caseItem.user_id)
              .single();
            
            if (userData) {
              userName = userData.name;
            }
          }
          
          return {
            ...caseItem,
            user_name: userName
          };
        })
      );
      
      setCases(casesWithUsers);
    } catch (err: any) {
      console.error('Error fetching found cases:', err);
      setError('Failed to load found items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoundCases();
  }, []);

  const filteredCases = React.useMemo(() => {
    if (!cases) return [];
    
    return cases.filter(caseItem => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = filters.categories.length === 0 || 
        filters.categories.includes(caseItem.category || '');
      
      // Location filter
      const matchesLocation = filters.locations.length === 0 ||
        filters.locations.includes(caseItem.location);
      
      // Status filter - Updated for Supabase values
      const matchesStatus = filters.status.length === 0 ||
        filters.status.includes(caseItem.status || 'active');
      
      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [cases, searchTerm, filters]);

  const paginatedCases = React.useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCases.slice(startIndex, endIndex);
  }, [filteredCases, page]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  const activeFilterCount = [
    filters.categories.length,
    filters.locations.length,
    filters.status.length,
  ].reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading found items...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Error loading found items. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Found Items
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Browse items found by COMSATS community members. Lost something? Check here first!
        </Typography>
      </Box>

      {/* Search and Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3 }}>
            <SearchBar
              placeholder="Search found items by title or description..."
              onSearch={(query) => {
                setSearchTerm(query);
                setPage(1);
              }}
              suggestions={[
                'Electronics',
                'Documents',
                'Accessories',
                'Books & Notes',
                'Clothing',
                'Wallets & Purses',
                'Keys',
                'ID Cards',
              ]}
              showHistory
              fullWidth
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            component={RouterLink}
            to="/report?type=found"
            sx={{ height: '56px' }}
          >
            Report Found
          </Button>
        </Grid>
      </Grid>

      {/* Main Content with Filters */}
      <Grid container spacing={3}>
        {/* Filter Panel */}
        <Grid item xs={12} md={3}>
          <FilterPanel
            onFilterChange={(newFilters) => {
              setFilters(prev => ({ ...prev, ...newFilters }));
              setPage(1);
            }}
            defaultFilters={filters}
          />
        </Grid>
        
        {/* Results Section */}
        <Grid item xs={12} md={9}>
          {/* Results Count */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredCases.length} found item{filteredCases.length !== 1 ? 's' : ''}
                {activeFilterCount > 0 && ' with filters'}
              </Typography>
              {activeFilterCount > 0 && (
                <Typography variant="caption" color="primary">
                  {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
            <Chip 
              label="Found Items" 
              color="success" 
              variant="outlined"
              icon={<CheckCircle />}
            />
          </Box>

          {/* Cases Grid */}
          {filteredCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No found items found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {searchTerm || activeFilterCount > 0
                  ? 'Try adjusting your search criteria or filters'
                  : 'Be the first to report a found item!'}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                component={RouterLink}
                to="/report?type=found"
              >
                Report a Found Item
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {paginatedCases.map((caseItem) => (
                  <Grid item xs={12} sm={6} md={4} key={caseItem.id}>
                    <CaseCard 
                      caseItem={caseItem} 
                      compact={true}
                      showActions={false}
                      userName={caseItem.user_name} // Pass userName prop
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}

          {/* Info Box */}
          <Alert severity="info" sx={{ mt: 4 }}>
            <Typography variant="body2">
              <strong>Important:</strong> If you recognize an item as yours, please contact the finder through the case details. Always verify ownership with specific details.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FoundItems;
