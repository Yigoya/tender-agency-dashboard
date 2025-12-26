import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  CircularProgress,
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

// Hidden metadata constants (sent silently with login request)
const HIDDEN_META = {
  FCMToken: 'dKB-Qr1oRlKZmcpB5bM7Ng:APA91bEDkEgF_hC8y6NgIFWBQ-Tq6w5dSp3ALhleFaPRQ2MDV_cwmP-YVQU2NHZ5y38H76kZrXfhVBRuquK7JLK8XgViuhQvaSpb3UkalYLo-TzsvceQpvg',
  deviceType: 'Samsung',
  deviceModel: 'M12',
  operatingSystem: 'ANDROID',
} as const;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const performLogin = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        setIsProcessing(true);

        const response = await authApi.login({ email, password, ...HIDDEN_META });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        dispatch(setAuth({ token, user }));

        const agencyResponse = await api.get(`/tender-agencies/user/${user.id}/profile`);
        localStorage.setItem('agencyProfile', JSON.stringify(agencyResponse.data));

        const status = (user?.status || user?.verifiedStatus || '').toString().toUpperCase();
        const isVerified = status === 'VERIFIED' || status === 'ACTIVE' || status === 'APPROVED';

        if (!isVerified) {
          if (email) {
            localStorage.setItem('pendingEmail', email);
          }
          toast.info('Please verify your email to continue.');
          navigate('/verify-email');
        } else {
          toast.success('Login successful!');
          navigate('/');
        }
      } catch (err: any) {
        const apiError = err.response?.data;
        const detailMessage =
          Array.isArray(apiError?.details) && apiError.details.length > 0
            ? apiError.details.join(', ')
            : apiError?.message;
        const fallbackMessage = detailMessage || 'Failed to login. Please try again.';
        setError(fallbackMessage);
        toast.error(fallbackMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, navigate]
  );

  const formik = useFormik<LoginRequest>({
    initialValues: {
      email: '',
      password: '',
      ...HIDDEN_META,
    },
    validationSchema,
    onSubmit: async (values) => {
      await performLogin(values.email, values.password);
    },
  });

  const autoEmail = searchParams.get('email');
  const autoPassword = searchParams.get('password');
  const shouldAutoLogin = Boolean(autoEmail && autoPassword);

  useEffect(() => {
    if (!shouldAutoLogin || !autoEmail || !autoPassword) return;
    performLogin(autoEmail, autoPassword);
  }, [autoEmail, autoPassword, performLogin, shouldAutoLogin]);

  if (shouldAutoLogin) {
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
            maxWidth: 380,
            width: '100%',
            p: 4,
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight={600} color="primary">
                Signing you in…
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Please wait while we secure your session.
              </Typography>
            </>
          )}
        </Card>
      </Box>
    );
  }

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
            disabled={isProcessing || formik.isSubmitting}
          >
            {isProcessing || formik.isSubmitting ? 'Signing In…' : 'Sign In'}
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