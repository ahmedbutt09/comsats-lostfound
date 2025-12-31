import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Paper,
  ClickAwayListener,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Search,
  Clear,
  History,
  TrendingUp,
} from '@mui/icons-material';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: string[];
  showHistory?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  suggestions = [],
  showHistory = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      
      // Update search history
      const updatedHistory = [
        searchQuery,
        ...searchHistory.filter(item => item !== searchQuery)
      ].slice(0, 5);
      
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
    
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const popularSearches = ['Wallet', 'Phone', 'Keys', 'ID Card', 'Laptop'];

  return (
    <ClickAwayListener onClickAway={() => setIsFocused(false)}>
      <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth={fullWidth}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            size={size}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>

        {/* Dropdown Suggestions */}
        {isFocused && (query || showHistory) && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1300,
              mt: 1,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {/* Current Query Suggestions */}
            {query && suggestions.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, color: 'text.secondary' }}>
                  Suggestions
                </Typography>
                <List dense>
                  {suggestions
                    .filter(suggestion =>
                      suggestion.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => {
                          setQuery(suggestion);
                          handleSearch(suggestion);
                        }}
                      >
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                </List>
              </>
            )}

            {/* Search History */}
            {showHistory && searchHistory.length > 0 && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    pb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Recent Searches
                  </Typography>
                  <IconButton size="small" onClick={handleClearHistory}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
                <List dense>
                  {searchHistory.map((item, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleHistoryClick(item)}
                    >
                      <History sx={{ mr: 2, fontSize: 16, color: 'text.secondary' }} />
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Popular Searches */}
            {showHistory && !query && (
              <>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, color: 'text.secondary' }}>
                  Popular Searches
                </Typography>
                <List dense>
                  {popularSearches.map((search, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                    >
                      <TrendingUp sx={{ mr: 2, fontSize: 16, color: 'text.secondary' }} />
                      <ListItemText primary={search} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* No Results */}
            {query && suggestions.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No suggestions found for "{query}"
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
