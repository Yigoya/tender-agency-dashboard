import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Box, Card, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { toast } from 'react-toastify';
import api, { authApi } from '../../services/api';
import { useAppDispatch } from '../../store/store';
import { setAuth } from '../../store/slices/authSlice';

export default function TokenLogin() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!tokenParam) {
      setError('Missing login token.');
      return;
    }

    let isActive = true;

    const runTokenLogin = async () => {
      try {
        setError(null);
        setIsProcessing(true);

        const response = await authApi.tokenLogin(tokenParam);
        if (!isActive) return;

        const { token, user } = response.data;
        const userId = user?.id !== undefined ? String(user.id) : '';

        localStorage.setItem('token', token);
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        dispatch(setAuth({ token, user }));

        try {
          const agencyResponse = await api.get(`/tender-agencies/user/${user.id}/profile`);
          if (isActive) {
            localStorage.setItem('agencyProfile', JSON.stringify(agencyResponse.data));
          }
        } catch (profileError) {
          if (isActive) {
            console.error('Failed to load agency profile after token login', profileError);
          }
        }

        const status = (user?.status || user?.verifiedStatus || '').toString().toUpperCase();
        const isVerified = status === 'VERIFIED' || status === 'ACTIVE' || status === 'APPROVED';

        if (!isVerified) {
          if (user?.email) {
            localStorage.setItem('pendingEmail', String(user.email));
          }
          toast.info('Please verify your email to continue.');
          navigate('/verify-email', { replace: true });
          return;
        }

        toast.success('Login successful!');
        navigate('/', { replace: true });
      } catch (err: any) {
        if (!isActive) return;
        const apiError = err.response?.data;
        const detailMessage =
          Array.isArray(apiError?.details) && apiError.details.length > 0
            ? apiError.details.join(', ')
            : apiError?.message;
        const fallbackMessage = detailMessage || 'Failed to login with token. Please try again.';
        setError(fallbackMessage);
        toast.error(fallbackMessage);
      } finally {
        if (isActive) {
          setIsProcessing(false);
        }
      }
    };

    runTokenLogin();

    return () => {
      isActive = false;
    };
  }, [tokenParam, navigate, dispatch]);

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
          maxWidth: 420,
          width: '100%',
          p: 4,
          boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight={600} color="primary">
              Finalizing your login…
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Please wait while we secure your session.
            </Typography>
            {isProcessing && (
              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                If this takes too long, return to the <Link to="/login">login page</Link>.
              </Typography>
            )}
          </>
        )}
      </Card>
    </Box>
  );
}
