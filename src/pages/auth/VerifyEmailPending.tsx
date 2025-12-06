import { Box, Card, Typography, Button, Stack } from '@mui/material';
import { MailCheck, ExternalLink } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';

export default function VerifyEmailPending() {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    const email = localStorage.getItem('pendingEmail');
    if (!email) {
      toast.error('No email found to resend verification.');
      return;
    }
    try {
      setResending(true);
      await authApi.resendVerification(email);
      toast.success('Verification email resent. Please check your inbox.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };
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
      <Card sx={{ maxWidth: 560, width: '100%', p: 4, borderRadius: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <MailCheck size={42} color="#1976d2" />
          <Typography variant="h5" fontWeight={700}>
            Verify your email
          </Typography>
          <Typography color="text.secondary">
            We sent a verification link to your inbox. Click the link in that email to activate your account.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              component="a"
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ExternalLink size={16} />}
            >
              Open Gmail
            </Button>
            <Button
              variant="outlined"
              component="a"
              href="https://outlook.live.com/mail/0/"
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ExternalLink size={16} />}
            >
              Open Outlook
            </Button>
            <Button
              variant="text"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Resending...' : 'Resend verification email'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Already verified?{' '}
            <RouterLink to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Sign in
            </RouterLink>
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
