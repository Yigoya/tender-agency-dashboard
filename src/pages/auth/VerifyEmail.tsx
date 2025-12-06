import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Card, CircularProgress, Typography, Button, Stack } from '@mui/material';
import { authApi } from '../../services/api';
import { useAppDispatch } from '../../store/store';
import { setAuth } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyEmail() {
  const query = useQuery();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('Verifying your email...');

  useEffect(() => {
    const token = query.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        setStatus('loading');
        setMessage('Verifying your email...');
        const res = await authApi.verifyEmail(token);
        const data = res.data as any;
        const authToken = data?.token;
        const user = data?.user;
        const agencyProfile = data?.tenderAgencyProfile;
        const agencyId = data?.agencyId ?? agencyProfile?.id ?? null;

        if (authToken) {
          localStorage.setItem('token', authToken);
        }
        if (user?.id) {
          localStorage.setItem('userId', String(user.id));
        }
        if (agencyProfile) {
          localStorage.setItem('agencyProfile', JSON.stringify(agencyProfile));
        }
        if (agencyId) {
          localStorage.setItem('agencyId', String(agencyId));
        }
        dispatch(setAuth({ token: authToken ?? localStorage.getItem('token'), user: user ?? null }));

        setStatus('success');
        setMessage('Email verified! Redirecting to dashboard...');
        toast.success('Email verified successfully');
        setTimeout(() => navigate('/'), 1200);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [dispatch, navigate, query]);

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
      <Card sx={{ maxWidth: 520, width: '100%', p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          {status === 'loading' && <CircularProgress color="primary" />}
          <Typography variant="h6" fontWeight={700}>
            {message}
          </Typography>

          {status === 'error' && (
            <Button variant="contained" color="primary" onClick={() => navigate('/verify-email')}>
              Go to Verify Page
            </Button>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
