import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchProfile } from '../store/slices/agencySlice';
import { agencyApi } from '../services/api';

const validationSchema = yup.object({
  companyName: yup.string().required('Company name is required'),
  website: yup.string().url('Enter a valid URL'),
  contactPerson: yup.string(),
});

export default function Profile() {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.agency);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    // In production, get the agencyId from auth context/state
    const agencyId = 1;
    dispatch(fetchProfile(agencyId));
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      companyName: profile?.companyName || '',
      website: profile?.website || '',
      contactPerson: profile?.contactPerson || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        // In production, get the agencyId from auth context/state
        const agencyId = 1;
        await agencyApi.updateProfile(agencyId, values);
        dispatch(fetchProfile(agencyId));
        toast.success('Profile updated successfully');
      } catch (error) {
        toast.error('Failed to update profile');
      }
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      // In production, get the agencyId from auth context/state
      const agencyId = 1;
      await agencyApi.uploadLicense(agencyId, file);
      dispatch(fetchProfile(agencyId));
      toast.success('License uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload license');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" mb={4}>
        Agency Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: 40,
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {profile?.companyName?.[0] || 'A'}
                </Avatar>
                <Typography variant="h6">{profile?.companyName}</Typography>
                <Typography color="textSecondary" mb={2}>
                  TIN: {profile?.tinNumber}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: profile?.verifiedStatus === 'VERIFIED' ? 'success.light' : 'warning.light',
                    color: profile?.verifiedStatus === 'VERIFIED' ? 'success.dark' : 'warning.dark',
                  }}
                >
                  {profile?.verifiedStatus}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3}>
                Profile Information
              </Typography>
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="companyName"
                      label="Company Name"
                      value={formik.values.companyName}
                      onChange={formik.handleChange}
                      error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                      helperText={formik.touched.companyName && formik.errors.companyName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="website"
                      label="Website"
                      value={formik.values.website}
                      onChange={formik.handleChange}
                      error={formik.touched.website && Boolean(formik.errors.website)}
                      helperText={formik.touched.website && formik.errors.website}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="contactPerson"
                      label="Contact Person"
                      value={formik.values.contactPerson}
                      onChange={formik.handleChange}
                      error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
                      helperText={formik.touched.contactPerson && formik.errors.contactPerson}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={!formik.dirty || !formik.isValid}
                    >
                      Save Changes
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={3}>
                Business License
              </Typography>
              <Box
                component="label"
                htmlFor="license-upload"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {uploadLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <Upload size={24} />
                    <Typography variant="body1" mt={1}>
                      Click to upload business license
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      PDF, JPG, or PNG (max. 5MB)
                    </Typography>
                  </>
                )}
                <input
                  id="license-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploadLoading}
                />
              </Box>
              {profile?.businessLicensePath && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Current license: {profile.businessLicensePath}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}