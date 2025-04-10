import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Bell, Mail, Lock, Shield } from 'lucide-react';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [tenderAlerts, setTenderAlerts] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    // Here you would typically make an API call to change the password
    toast.success('Password updated successfully');
    setPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Icon size={24} />
          <Typography variant="h6" ml={1}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" mb={4}>
        Settings
      </Typography>

      <SettingSection title="Notifications" icon={Bell}>
        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive email notifications for important updates"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Tender Alerts"
              secondary="Get notified when new tenders are posted"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={tenderAlerts}
                onChange={(e) => setTenderAlerts(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Status Updates"
              secondary="Receive notifications for tender status changes"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={statusUpdates}
                onChange={(e) => setStatusUpdates(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </SettingSection>

      <SettingSection title="Email Preferences" icon={Mail}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Manage your email preferences and communication settings
        </Typography>
        <Button variant="outlined" color="primary">
          Update Email Preferences
        </Button>
      </SettingSection>

      <SettingSection title="Security" icon={Shield}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Manage your account security settings
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setPasswordDialog(true)}
          startIcon={<Lock size={18} />}
        >
          Change Password
        </Button>
      </SettingSection>

      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}