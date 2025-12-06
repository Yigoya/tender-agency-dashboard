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
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api, { authApi } from '../../services/api';
import { useAppDispatch } from '../../store/store';
import { setAuth } from '../../store/slices/authSlice';
import type { LoginRequest } from '../../types/api';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .required('Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidden metadata constants (sent silently with login request)
  const HIDDEN_META = {
    FCMToken: 'dKB-Qr1oRlKZmcpB5bM7Ng:APA91bEDkEgF_hC8y6NgIFWBQ-Tq6w5dSp3ALhleFaPRQ2MDV_cwmP-YVQU2NHZ5y38H76kZrXfhVBRuquK7JLK8XgViuhQvaSpb3UkalYLo-TzsvceQpvg',
    deviceType: 'Samsung',
    deviceModel: 'M12',
    operatingSystem: 'ANDROID',
  } as const;

  const formik = useFormik<LoginRequest>({
    initialValues: {
      email: '',
      password: '',
      ...HIDDEN_META,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
  // Merge visible credentials with hidden metadata constants
  const response = await authApi.login({ ...values, ...HIDDEN_META });

        const { token, user } = response.data;
        
        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        dispatch(setAuth({ token, user }));
        
        // Get agency profile (axios client will include Authorization header via interceptor)
        const agencyResponse = await api.get(`/tender-agencies/user/${user.id}/profile`);
        localStorage.setItem('agencyProfile', JSON.stringify(agencyResponse.data));
        
        // If user is not verified, send to verify page
        const status = (user?.status || user?.verifiedStatus || '').toString().toUpperCase();
        const isVerified = status === 'VERIFIED' || status === 'ACTIVE' || status === 'APPROVED';

        if (!isVerified) {
          // Keep the email used for resend
          if (values.email) {
            localStorage.setItem('pendingEmail', values.email);
          }
          toast.info('Please verify your email to continue.');
          navigate('/verify-email');
        } else {
          toast.success('Login successful!');
          navigate('/');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to login. Please try again.');
        toast.error('Login failed');
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
  background: 'linear-gradient(45deg, #2b78ac 30%, #2b78ac 90%)',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          p: 4,
          boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
          borderRadius: 3,
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            Welcome Back
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Enter your credentials to access your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={20} />
                </InputAdornment>
              ),
            }}
          />

          {/* Hidden metadata fields are not rendered. */}
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            sx={{ mb: 3 }}
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

          <Button
            fullWidth
            size="large"
            variant="contained"
            type="submit"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
            }}
          >
            Sign In
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography color="text.secondary" variant="body2">
            OR
          </Typography>
        </Divider>

        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#2b78ac',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Register Now
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}