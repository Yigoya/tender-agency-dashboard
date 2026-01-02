import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchTenderById } from '../store/slices/tenderSlice';
import { adminApi, tenderApi } from '../services/api';
import type { ServiceNode } from '../types/api';
import { getAgencyIdFromStorage } from '../utils/agency';

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
  const [serviceLookup, setServiceLookup] = useState<Map<number, string>>(new Map());
  const agencyId = useMemo(() => getAgencyIdFromStorage(), []);

  useEffect(() => {
    if (!agencyId) {
      toast.error('Missing agency information. Please log in again.');
      navigate('/login', { replace: true });
      return;
    }

    if (id) {
      dispatch(fetchTenderById({ agencyId, tenderId: parseInt(id, 10) }));
    }
  }, [agencyId, dispatch, id, navigate]);

  useEffect(() => {
    const flattenServices = (
      nodes: ServiceNode[] = [],
      trail: string[] = []
    ): Array<{ id: number; breadcrumb: string }> =>
      nodes.flatMap((node) => {
        const currentTrail = [...trail, node.name];
        const current = { id: node.serviceId, breadcrumb: currentTrail.join(' / ') };
        const children = node.services ? flattenServices(node.services, currentTrail) : [];
        return [current, ...children];
      });

    const loadServices = async () => {
      try {
        const { data } = await adminApi.getServices();
        const tenderCategory = data.find((category) => category.categoryId === 1);
        if (!tenderCategory) return;
        const flattened = flattenServices(tenderCategory.services || []);
        setServiceLookup(new Map(flattened.map((entry) => [entry.id, entry.breadcrumb])));
      } catch (err) {
        console.error('Failed to load services', err);
      }
    };

    loadServices();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (!agencyId) {
      toast.error('Missing agency information. Please log in again.');
      return;
    }

    try {
      setUploadLoading(true);
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

    if (!agencyId) {
      toast.error('Missing agency information. Please log in again.');
      return;
    }

    try {
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
  const safeFormatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return '-';
    return format(parsed, 'MMM d, yyyy');
  };
  const safeFormatDateTime = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return value;
    return format(parsed, 'MMM d, yyyy p');
  };
  const tenderService = typeof tender.serviceId === 'number' ? serviceLookup.get(tender.serviceId) : undefined;

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
                      Posted: {safeFormatDate(tender.datePosted)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Calendar size={20} />
                    <Typography variant="body1" ml={1}>
                      Closes: {safeFormatDate(tender.closingDate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Key Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Reference Number
                    </Typography>
                    <Typography variant="body1">{tender.referenceNumber || '-'}</Typography>
                  </Grid>
                  {/* <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Notice Number
                    </Typography>
                    <Typography variant="body1">{tender.noticeNumber || '-'}</Typography>
                  </Grid> */}
                  {/* <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tender Reference Notice No.
                    </Typography>
                    <Typography variant="body1">{tender.tenderReferenceNoticeNo || '-'}</Typography>
                  </Grid> */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tender Notice Code
                    </Typography>
                    <Typography variant="body1">{tender.tenderNoticeCode || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Publication Venue
                    </Typography>
                    <Typography variant="body1">{tender.publishedOn || '-'}</Typography>
                  </Grid>
                  {/* <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Product Category
                    </Typography>
                    <Typography variant="body1">{tender.productCategory || '-'}</Typography>
                  </Grid> */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tender Type
                    </Typography>
                    <Typography variant="body1">{tender.tenderType || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Procurement Method
                    </Typography>
                    <Typography variant="body1">{tender.procurementMethod || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Service
                    </Typography>
                    <Typography variant="body1">
                      {tenderService ?? (typeof tender.serviceId === 'number' ? `Service #${tender.serviceId}` : 'Not provided')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Cost of Tender Document
                    </Typography>
                    <Typography variant="body1">{tender.costOfTenderDocument || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Is Free
                    </Typography>
                    <Typography variant="body1">{tender.isFree ? 'Yes' : 'No'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Commercial Terms
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Validity
                    </Typography>
                    <Typography variant="body1">{tender.bidValidity || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Security
                    </Typography>
                    <Typography variant="body1">{tender.bidSecurity || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Period
                    </Typography>
                    <Typography variant="body1">{tender.contractPeriod || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Performance Security
                    </Typography>
                    <Typography variant="body1">{tender.performanceSecurity || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Terms
                    </Typography>
                    <Typography variant="body1">{tender.paymentTerms || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Deliverables & Specifications
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Key Deliverables
                </Typography>
                <Typography variant="body1" paragraph>
                  {tender.keyDeliverables || 'Not provided.'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Technical Specifications
                </Typography>
                <Typography variant="body1">
                  {tender.technicalSpecifications || 'Not provided.'}
                </Typography>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Question Deadline
                    </Typography>
                    <Typography variant="body1">{safeFormatDateTime(tender.questionDeadline)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Deadline for Clarifications
                    </Typography>
                    <Typography variant="body1">
                      {safeFormatDateTime(tender.deadlineForClarifications)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pre-Bid Meeting
                    </Typography>
                    <Typography variant="body1">{safeFormatDateTime(tender.preBidMeeting)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Submission Deadline
                    </Typography>
                    <Typography variant="body1">
                      {safeFormatDateTime(tender.bidSubmissionDeadline)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Opening Date
                    </Typography>
                    <Typography variant="body1">{safeFormatDateTime(tender.bidOpeningDate)}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Submission Logistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Document Collection Location
                    </Typography>
                    <Typography variant="body1">
                      {tender.tenderDocumentCollectionLocation || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Document Collection Time
                    </Typography>
                    <Typography variant="body1">
                      {tender.tenderDocumentCollectionTime || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Document Download
                    </Typography>
                    {tender.tenderDocumentDownload ? (
                      <Typography
                        variant="body1"
                        component="a"
                        href={tender.tenderDocumentDownload}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {tender.tenderDocumentDownload}
                      </Typography>
                    ) : (
                      <Typography variant="body1">-</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Submission Mode
                    </Typography>
                    <Typography variant="body1">{tender.bidSubmissionMode || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Site Visit
                    </Typography>
                    <Typography variant="body1">{tender.siteVisit || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Bid Submission Address
                    </Typography>
                    <Typography variant="body1">{tender.bidSubmissionAddress || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Eligibility & Requirements
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      General Eligibility
                    </Typography>
                    <Typography variant="body1">{tender.generalEligibility || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Technical Requirements
                    </Typography>
                    <Typography variant="body1">{tender.technicalRequirements || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Financial Requirements
                    </Typography>
                    <Typography variant="body1">{tender.financialRequirements || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Experience
                    </Typography>
                    <Typography variant="body1">{tender.experience || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Warranty
                    </Typography>
                    <Typography variant="body1">{tender.warranty || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Organisation & Governance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Organization
                    </Typography>
                    <Typography variant="body1">{tender.organization || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1">{tender.department || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">{tender.address || '-'}</Typography>
                  </Grid>
                  {/* <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tender Location
                    </Typography>
                    <Typography variant="body1">{tender.tenderLocation || '-'}</Typography>
                  </Grid> */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Language of Bids
                    </Typography>
                    <Typography variant="body1">{tender.languageOfBids || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Validity Period of Bids
                    </Typography>
                    <Typography variant="body1">{tender.validityPeriodOfBids || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Governing Law
                    </Typography>
                    <Typography variant="body1">{tender.governingLaw || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>
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