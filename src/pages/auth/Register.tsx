import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
  Globe,
  User,
  Receipt,
} from 'lucide-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';

const validationSchema = yup.object({
  companyName: yup.string().required('Company name is required'),
  tinNumber: yup.string().required('TIN number is required'),
  website: yup.string().url('Enter a valid URL'),
  contactPerson: yup.string(),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      companyName: '',
      tinNumber: '',
      website: '',
      contactPerson: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        const { confirmPassword, ...registerData } = values;
        
        const response = await api.post('/tender-agencies/register', registerData);
        
        toast.success('Registration successful! Please login to continue.');
        navigate('/login');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        toast.error('Registration failed');
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 800,
          width: '100%',
          p: 4,
          boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
          borderRadius: 3,
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            Create Account
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Register your agency to start managing tenders
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="companyName"
                label="Company Name"
                value={formik.values.companyName}
                onChange={formik.handleChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2 size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="tinNumber"
                label="TIN Number"
                value={formik.values.tinNumber}
                onChange={formik.handleChange}
                error={formik.touched.tinNumber && Boolean(formik.errors.tinNumber)}
                helperText={formik.touched.tinNumber && formik.errors.tinNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Receipt size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="website"
                label="Website"
                value={formik.values.website}
                onChange={formik.handleChange}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Globe size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="contactPerson"
                label="Contact Person"
                value={formik.values.contactPerson}
                onChange={formik.handleChange}
                error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
                helperText={formik.touched.contactPerson && formik.errors.contactPerson}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <User size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Button
            fullWidth
            size="large"
            variant="contained"
            type="submit"
            sx={{
              mt: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
            }}
          >
            Create Account
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography color="text.secondary" variant="body2">
            OR
          </Typography>
        </Divider>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#1976d2',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}