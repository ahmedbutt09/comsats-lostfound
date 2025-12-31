import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Paper,
  Typography,
  IconButton,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AddPhotoAlternate,
  Delete,
  LocationOn,
  Category as CategoryIcon,
  Description,
  Title as TitleIcon,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CATEGORIES, LOCATIONS } from '../../utils/constants';
import { Case } from '../../types';

// Define separate types for form input and output
type CaseFormInput = {
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contact_info: 'chat' | 'email' | 'phone';
};

type CaseFormOutput = {
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contact_info: 'chat' | 'email' | 'phone';
};

// Schema for form validation (REMOVED reward field)
const caseSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  location: z.string().min(1, 'Please select a location'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please select a valid date',
  }),
  contact_info: z.enum(['chat', 'email', 'phone']),
});

interface CaseFormProps {
  initialData?: Partial<Case>;
  onSubmit: (data: CaseFormOutput, imageFile?: File) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
}

const CaseForm: React.FC<CaseFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  submitText = 'Submit Report',
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Prepare default values
const defaultValues: Partial<CaseFormInput> = {
  type: (initialData?.type === 'lost' || initialData?.type === 'found' ? initialData.type : 'lost'),
  title: initialData?.title || '',
  category: initialData?.category || '',
  description: initialData?.description || '',
  location: initialData?.location || '',
  date: initialData?.created_at 
    ? new Date(initialData.created_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
  contact_info: (initialData?.contact_info as 'chat' | 'email' | 'phone') || 'chat',
};

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CaseFormInput>({
    resolver: zodResolver(caseSchema),
    defaultValues,
  });

  const watchType = watch('type');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const onFormSubmit = async (formData: CaseFormInput) => {
    try {
      setError('');
      
      // Transform form data to output format for Supabase
      const outputData: CaseFormOutput = {
        ...formData,
      };
      
      await onSubmit(outputData, imageFile || undefined);
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Grid container spacing={3}>
        {/* Item Type Selection */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Item Type
            </FormLabel>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel
                    value="lost"
                    control={<Radio color="error" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>Lost Item</Typography>
                        <Typography variant="caption" color="text.secondary">
                          (You lost something)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="found"
                    control={<Radio color="success" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>Found Item</Typography>
                        <Typography variant="caption" color="text.secondary">
                          (You found something)
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              )}
            />
          </Paper>
        </Grid>

        {/* Title and Category */}
        <Grid item xs={12} md={6}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Item Title"
                placeholder="e.g., Black Samsung Galaxy S23, Brown Leather Wallet, etc."
                error={!!errors.title}
                helperText={errors.title?.message}
                InputProps={{
                  startAdornment: <TitleIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  {...field}
                  label="Category"
                  startAdornment={<CategoryIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.category.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={4}
                label="Detailed Description"
                placeholder="Describe the item in detail. Include brand, model, color, distinguishing features, contents (if wallet/bag), etc."
                error={!!errors.description}
                helperText={errors.description?.message}
                InputProps={{
                  startAdornment: (
                    <Description
                      sx={{
                        mr: 1,
                        color: 'action.active',
                        alignSelf: 'flex-start',
                        mt: 1,
                      }}
                    />
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Image Upload */}
        <Grid item xs={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              borderStyle: imagePreview ? 'solid' : 'dashed',
              cursor: 'pointer',
              backgroundColor: imagePreview ? 'transparent' : 'action.hover',
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            
            {imagePreview ? (
              <Box sx={{ position: 'relative', width: '100%' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    margin: '0 auto',
                  }}
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            ) : (
              <Box>
                <AddPhotoAlternate sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Click to upload item photo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum file size: 5MB • JPG, PNG, WebP
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Location and Date */}
        <Grid item xs={12} md={6}>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.location}>
                <InputLabel>Location</InputLabel>
                <Select
                  {...field}
                  label="Location"
                  startAdornment={<LocationOn sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {LOCATIONS.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
                {errors.location && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.location.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
            )}
          />
        </Grid>

        {/* Contact Preference */}
        <Grid item xs={12}>
          <Controller
            name="contact_info"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Contact Preference</InputLabel>
                <Select {...field} label="Contact Preference">
                  <MenuItem value="chat">In-app Chat</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone Call</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  How should people contact you about this item?
                </Typography>
              </FormControl>
            )}
          />
        </Grid>

        {/* Error Display */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Safety Tips */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Safety Tips:
            </Typography>
            <Typography variant="body2">
              • Be specific about location details<br />
              • Include clear, well-lit photos<br />
              • Verify ownership with specific details before returning items<br />
              • Always meet in public places on campus<br />
              • Report suspicious activity to campus security
            </Typography>
          </Alert>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Submitting...' : submitText}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default CaseForm;
