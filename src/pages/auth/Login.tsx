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
import api from '../../services/api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        const deviceInfo = {
          FCMToken: "dKB-Qr1oRlKZmcpB5bM7Ng:APA91bEDkEgF_hC8y6NgIFWBQ-Tq6w5dSp3ALhleFaPRQ2MDV_cwmP-YVQU2NHZ5y38H76kZrXfhVBRuquK7JLK8XgViuhQvaSpb3UkalYLo-TzsvceQpvg",
          deviceType: navigator.platform,
          deviceModel: navigator.userAgent,
          operatingSystem: navigator.platform
        };

        const response = await api.post('/auth/login', {
          ...values,
          ...deviceInfo
        });

        const { token, user } = response.data;
        
        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        
        // Get agency profile
        const agencyResponse = await api.get(`/tender-agencies/user/${user.id}/profile`);
        localStorage.setItem('agencyProfile', JSON.stringify(agencyResponse.data));
        
        toast.success('Login successful!');
        navigate('/');
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
        background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
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
                color: '#1976d2',
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