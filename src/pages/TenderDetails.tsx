import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchTenderById } from '../store/slices/tenderSlice';
import { tenderApi } from '../services/api';

const statusColors = {
  OPEN: '#2b78ac',
  CLOSED: '#2b78ac',
  CANCELLED: '#2b78ac',
};

const statusIcons = {
  OPEN: CheckCircle,
  CLOSED: XCircle,
  CANCELLED: AlertCircle,
};

export default function TenderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedTender: tender, loading, error } = useAppSelector((state) => state.tender);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'OPEN' | 'CLOSED' | 'CANCELLED'>('OPEN');

  useEffect(() => {
    if (id) {
      // In production, get the agencyId from auth context/state
      const agencyId = 1;
      dispatch(fetchTenderById({ agencyId, tenderId: parseInt(id, 10) }));
    }
  }, [dispatch, id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploadLoading(true);
      // In production, get the agencyId from auth context/state
      const agencyId = 1;
      await tenderApi.uploadDocument(agencyId, parseInt(id, 10), file);
      dispatch(fetchTenderById({ agencyId, tenderId: parseInt(id, 10) }));
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!id) return;

    try {
      // In production, get the agencyId from auth context/state
      const agencyId = 1;
      await tenderApi.updateStatus(agencyId, parseInt(id, 10), newStatus);
      dispatch(fetchTenderById({ agencyId, tenderId: parseInt(id, 10) }));
      toast.success('Status updated successfully');
      setStatusDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update status');
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

  if (!tender) {
    return <Alert severity="error">Tender not found</Alert>;
  }

  const StatusIcon = statusIcons[tender.status];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/tenders')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Tender Details
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setStatusDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Change Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box mb={3}>
                <Typography variant="h5" gutterBottom>
                  {tender.title}
                </Typography>
                <Chip
                  icon={<StatusIcon size={16} />}
                  label={tender.status}
                  sx={{
                    backgroundColor: `${statusColors[tender.status]}20`,
                    color: statusColors[tender.status],
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>

              <Typography variant="body1" color="text.secondary" paragraph>
                {tender.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MapPin size={20} />
                    <Typography variant="body1" ml={1}>
                      {tender.location}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone size={20} />
                    <Typography variant="body1" ml={1}>
                      {tender.contactInfo}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Calendar size={20} />
                    <Typography variant="body1" ml={1}>
                      Posted: {format(new Date(tender.datePosted), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Calendar size={20} />
                    <Typography variant="body1" ml={1}>
                      Closes: {format(new Date(tender.closingDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <HelpCircle size={20} />
                    <Typography variant="body1" ml={1}>
                      Questions Due: {format(new Date(tender.questionDeadline), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tender Document
              </Typography>
              {tender.documentPath ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Current document: {tender.documentPath}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    component="label"
                    startIcon={<Upload />}
                    fullWidth
                  >
                    Upload New Document
                    <input
                      type="file"
                      hidden
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx"
                    />
                  </Button>
                </Box>
              ) : (
                <Box
                  component="label"
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
                        Upload Tender Document
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PDF, DOC, or DOCX (max. 10MB)
                      </Typography>
                      <input
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx"
                      />
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Tender Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
            sx={{ mt: 2 }}
          >
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="CLOSED">Closed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}