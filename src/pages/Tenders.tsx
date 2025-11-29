import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchTenders } from '../store/slices/tenderSlice';
import { adminApi, tenderApi } from '../services/api';
import type { ServiceNode } from '../types/api';

// Validation: keep original simple fields required; advanced nested fields optional.
const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  closingDate: yup.string().required('Closing date is required'),
  contactInfo: yup.string().required('Contact information is required'),
  serviceId: yup.number().required('Service is required'),
  questionDeadline: yup.string().required('Question deadline is required'),
  isFree: yup.boolean().optional(),
  // Advanced nested (all optional if user does not toggle advanced mode)
  summary: yup.object({
    referenceNo: yup.string().optional(),
    publishedOn: yup.string().optional(),
    bidDeadline: yup.string().optional(),
    category: yup.string().optional(),
    type: yup.string().optional(),
    procurementMethod: yup.string().optional(),
    noticeNo: yup.string().optional(),
    documentCost: yup.mixed().optional(),
    location: yup.string().optional(),
  }).optional(),
  financials: yup.object({
    bidValidityDays: yup.number().optional(),
    bidSecurityAmount: yup.number().optional(),
    contractPeriodDays: yup.number().optional(),
    performanceSecurityPercent: yup.number().optional(),
    paymentTerms: yup.string().optional(),
  }).optional(),
  scope: yup.object({
    standards: yup.array().of(yup.string()).optional(),
    earthworkExcavationCuM: yup.number().optional(),
    concreteM35SqM: yup.number().optional(),
    rccCulvertsCount: yup.number().optional(),
    stormWaterDrainKm: yup.number().optional(),
    warrantyMonths: yup.number().optional(),
  }).optional(),
  eligibility: yup.object({
    registrationCertificateRequired: yup.boolean().optional(),
    similarProjectMinValue: yup.number().optional(),
    turnoverMinAvg: yup.number().optional(),
  }).optional(),
  timeline: yup.object({
    preBidMeeting: yup.string().optional(),
    siteVisitStart: yup.string().optional(),
    siteVisitEnd: yup.string().optional(),
    clarificationDeadline: yup.string().optional(),
    bidOpeningDate: yup.string().optional(),
  }).optional(),
  submission: yup.object({
    documentLink: yup.string().url('Must be a valid URL').optional(),
    submissionMode: yup.string().optional(),
    submissionAddress: yup.string().optional(),
  }).optional(),
  issuingAuthority: yup.object({
    organization: yup.string().optional(),
    department: yup.string().optional(),
    address: yup.string().optional(),
    tenderLocation: yup.string().optional(),
    languageOfBids: yup.string().optional(),
    governingLaw: yup.string().optional(),
  }).optional(),
  status: yup.string().oneOf(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
});

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

export default function Tenders() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tenders, loading, error } = useAppSelector((state) => state.tender);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTender, setSelectedTender] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flatServices, setFlatServices] = useState<{ node: ServiceNode; depth: number }[]>([]);
  const [servicesLoading, setServicesLoading] = useState<boolean>(false);
  const flattenServicesTree = (
    nodes: ServiceNode[],
    depth = 0
  ): { node: ServiceNode; depth: number }[] =>
    nodes.flatMap((n) => [{ node: n, depth }, ...flattenServicesTree(n.services || [], depth + 1)]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // In production, get the agencyId from auth context/state
    const agencyId = 1;
    dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
  }, [dispatch, page, rowsPerPage]);

  useEffect(() => {
    // Load services from admin endpoint and keep only categoryId = 1
    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const { data } = await adminApi.getServices();
        const categoryOne = data.find((c) => c.categoryId === 1);
        if (categoryOne) {
          setFlatServices(flattenServicesTree(categoryOne.services || []));
        }
      } catch (err) {
        console.error('Failed to load services', err);
        toast.error('Failed to load services');
      } finally {
        setServicesLoading(false);
      }
    };
    loadServices();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (tenderId?: number) => {
    if (tenderId) {
      setSelectedTender(tenderId);
    } else {
      setSelectedTender(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTender(null);
    formik.resetForm();
  };

  const handleDeleteClick = (tenderId: number) => {
    setSelectedTender(tenderId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTender) return;

    try {
      // In production, get the agencyId from auth context/state
      const agencyId = 1;
      await tenderApi.delete(agencyId, selectedTender);
      dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
      toast.success('Tender deleted successfully');
    } catch (error) {
      toast.error('Failed to delete tender');
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedTender(null);
    }
  };

  const [advancedMode, setAdvancedMode] = useState(false);
  const formik = useFormik({
    initialValues: {
      // Simple legacy fields
      title: '',
      description: '',
      location: '',
      closingDate: '',
      contactInfo: '',
      serviceId: 1,
      questionDeadline: '',
      isFree: false,
      // Advanced nested fields (all optional)
      summary: {
        referenceNo: '',
        publishedOn: '',
        bidDeadline: '',
        category: '',
        type: '',
        procurementMethod: '',
        noticeNo: '',
        documentCost: '',
        location: '',
      },
      financials: {
        bidValidityDays: undefined as number | undefined,
        bidSecurityAmount: undefined as number | undefined,
        contractPeriodDays: undefined as number | undefined,
        performanceSecurityPercent: undefined as number | undefined,
        paymentTerms: '',
      },
      scope: {
        standards: [] as string[],
        earthworkExcavationCuM: undefined as number | undefined,
        concreteM35SqM: undefined as number | undefined,
        rccCulvertsCount: undefined as number | undefined,
        stormWaterDrainKm: undefined as number | undefined,
        warrantyMonths: undefined as number | undefined,
      },
      eligibility: {
        registrationCertificateRequired: false,
        similarProjectMinValue: undefined as number | undefined,
        turnoverMinAvg: undefined as number | undefined,
      },
      timeline: {
        preBidMeeting: '',
        siteVisitStart: '',
        siteVisitEnd: '',
        clarificationDeadline: '',
        bidOpeningDate: '',
      },
      submission: {
        documentLink: '',
        submissionMode: 'Physical',
        submissionAddress: '',
      },
      issuingAuthority: {
        organization: '',
        department: '',
        address: '',
        tenderLocation: '',
        languageOfBids: '',
        governingLaw: '',
      },
      status: 'OPEN',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // In production, get the agencyId from auth context/state
        const agencyId = 1;
        // Build nested payload regardless of mode
        const nestedPayload = {
          summary: {
            referenceNo: values.summary.referenceNo || values.title,
            publishedOn: values.summary.publishedOn || new Date().toISOString().split('T')[0],
            bidDeadline: values.summary.bidDeadline || values.closingDate,
            category: values.summary.category || 'General',
            type: values.summary.type || 'National',
            procurementMethod: values.summary.procurementMethod || 'Open Tender',
            noticeNo: values.summary.noticeNo || undefined,
            documentCost: values.summary.documentCost || undefined,
            location: values.summary.location || values.location,
          },
          financials: {
            bidValidityDays: values.financials.bidValidityDays ?? 0,
            bidSecurityAmount: values.financials.bidSecurityAmount ?? 0,
            contractPeriodDays: values.financials.contractPeriodDays ?? 0,
            performanceSecurityPercent: values.financials.performanceSecurityPercent ?? 0,
            paymentTerms: values.financials.paymentTerms || 'As per tender',
          },
            scope: {
            standards: values.scope.standards.length ? values.scope.standards : ['GENERAL'],
            earthworkExcavationCuM: values.scope.earthworkExcavationCuM,
            concreteM35SqM: values.scope.concreteM35SqM,
            rccCulvertsCount: values.scope.rccCulvertsCount,
            stormWaterDrainKm: values.scope.stormWaterDrainKm,
            warrantyMonths: values.scope.warrantyMonths,
          },
          eligibility: {
            registrationCertificateRequired: values.eligibility.registrationCertificateRequired || false,
            similarProjectMinValue: values.eligibility.similarProjectMinValue,
            turnoverMinAvg: values.eligibility.turnoverMinAvg,
          },
          timeline: {
            preBidMeeting: values.timeline.preBidMeeting || undefined,
            siteVisitStart: values.timeline.siteVisitStart || undefined,
            siteVisitEnd: values.timeline.siteVisitEnd || undefined,
            clarificationDeadline: values.timeline.clarificationDeadline || undefined,
            bidOpeningDate: values.timeline.bidOpeningDate || undefined,
          },
          submission: {
            documentLink: values.submission.documentLink || undefined,
            submissionMode: values.submission.submissionMode || 'Physical',
            submissionAddress: values.submission.submissionAddress || undefined,
          },
          issuingAuthority: {
            organization: values.issuingAuthority.organization || 'Unknown Org',
            department: values.issuingAuthority.department || undefined,
            address: values.issuingAuthority.address || undefined,
            tenderLocation: values.issuingAuthority.tenderLocation || values.location,
            languageOfBids: values.issuingAuthority.languageOfBids || undefined,
            governingLaw: values.issuingAuthority.governingLaw || undefined,
          },
          serviceId: values.serviceId,
          status: values.status as any,
        };
        if (selectedTender) {
          await tenderApi.update(agencyId, selectedTender, nestedPayload as any);
          toast.success('Tender updated successfully');
        } else {
          const { data: created } = await tenderApi.create(agencyId, nestedPayload as any);
          // If a file is provided, upload it after creation
          if (file) {
            try {
              await tenderApi.uploadDocument(agencyId, created.id, file);
              toast.success('Tender and file uploaded successfully');
            } catch (uploadErr) {
              console.error(uploadErr);
              toast.warn('Tender created, but file upload failed');
            }
          } else {
            toast.success('Tender created successfully');
          }
        }
        dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
        handleCloseDialog();
      } catch (error) {
        toast.error(selectedTender ? 'Failed to update tender' : 'Failed to create tender');
      }
    },
  });

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Tenders</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenDialog()}
        >
          New Tender
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Bid Deadline</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenders.map((tender) => {
                  const StatusIcon = statusIcons[tender.status];
                  return (
                    <TableRow
                      key={tender.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      <TableCell>{(tender as any).summary?.referenceNo ?? '-'}</TableCell>
                      <TableCell>{(tender as any).summary?.location ?? '-'}</TableCell>
                      <TableCell>{(tender as any).summary?.publishedOn ? format(new Date((tender as any).summary.publishedOn), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{(tender as any).summary?.bidDeadline ? format(new Date((tender as any).summary.bidDeadline), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<StatusIcon size={16} />}
                          label={tender.status}
                          size="small"
                          sx={{
                            backgroundColor: `${statusColors[tender.status]}20`,
                            color: statusColors[tender.status],
                            '& .MuiChip-icon': {
                              color: 'inherit',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(tender.id);
                          }}
                        >
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(tender.id);
                          }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {selectedTender ? 'Edit Tender' : 'Create New Tender'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Simple legacy fields */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="title"
                  label="Title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  label="Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="location"
                  label="Location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={formik.touched.location && Boolean(formik.errors.location)}
                  helperText={formik.touched.location && formik.errors.location}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="serviceId"
                  label="Category"
                  select
                  value={formik.values.serviceId}
                  onChange={formik.handleChange}
                  error={formik.touched.serviceId && Boolean(formik.errors.serviceId)}
                  helperText={servicesLoading ? 'Loading categories…' : formik.touched.serviceId && (formik.errors as any).serviceId}
                  disabled={servicesLoading}
                >
                  {servicesLoading ? (
                    <MenuItem value={formik.values.serviceId} disabled>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <span>Loading…</span>
                      </Box>
                    </MenuItem>
                  ) : (
                    flatServices.map(({ node, depth }) => (
                      <MenuItem key={node.serviceId} value={node.serviceId} sx={{ pl: 1 + depth * 2 }}>
                        {depth > 0 ? '— '.repeat(depth) : ''}
                        {node.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" fullWidth>
                  {file ? `Selected: ${file.name}` : 'Upload Document'}
                  <input
                    hidden
                    type="file"
                    name="file"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0] || null;
                      setFile(f);
                    }}
                  />
                </Button>
              </Grid>
              {/* Advanced toggle */}
              <Grid item xs={12}>
                <Button variant="text" onClick={() => setAdvancedMode((m) => !m)}>
                  {advancedMode ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
                </Button>
              </Grid>
              {advancedMode && (
                <>
                  {/* Summary Advanced */}
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.referenceNo" label="Reference No" value={(formik.values as any).summary.referenceNo} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.category" label="Category" value={(formik.values as any).summary.category} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.type" label="Type" value={(formik.values as any).summary.type} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.procurementMethod" label="Procurement Method" value={(formik.values as any).summary.procurementMethod} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.noticeNo" label="Notice No" value={(formik.values as any).summary.noticeNo} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.documentCost" label="Document Cost" value={(formik.values as any).summary.documentCost as any} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="summary.location" label="Location Override" value={(formik.values as any).summary.location} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="date" name="summary.publishedOn" label="Published On" value={(formik.values as any).summary.publishedOn} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="datetime-local" name="summary.bidDeadline" label="Bid Deadline" value={(formik.values as any).summary.bidDeadline} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </>
              )}
              {advancedMode && (
                <>
                  {/* Financials */}
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" name="financials.bidValidityDays" label="Bid Validity (days)" value={(formik.values as any).financials.bidValidityDays ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" name="financials.bidSecurityAmount" label="Bid Security Amount" value={(formik.values as any).financials.bidSecurityAmount ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" name="financials.contractPeriodDays" label="Contract Period (days)" value={(formik.values as any).financials.contractPeriodDays ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="number" name="financials.performanceSecurityPercent" label="Performance Security (%)" value={(formik.values as any).financials.performanceSecurityPercent ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth name="financials.paymentTerms" label="Payment Terms" value={(formik.values as any).financials.paymentTerms} onChange={formik.handleChange} />
                  </Grid>

                  {/* Scope */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="scope.standards"
                      label="Standards (comma separated)"
                      value={((formik.values as any).scope.standards as string[]).join(', ')}
                      onChange={(e) =>
                        formik.setFieldValue(
                          'scope.standards',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="scope.earthworkExcavationCuM" label="Earthwork (CuM)" value={(formik.values as any).scope.earthworkExcavationCuM ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="scope.concreteM35SqM" label="Concrete M35 (SqM)" value={(formik.values as any).scope.concreteM35SqM ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="scope.rccCulvertsCount" label="RCC Culverts (count)" value={(formik.values as any).scope.rccCulvertsCount ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="scope.stormWaterDrainKm" label="Storm Water Drain (km)" value={(formik.values as any).scope.stormWaterDrainKm ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="scope.warrantyMonths" label="Warranty (months)" value={(formik.values as any).scope.warrantyMonths ?? ''} onChange={formik.handleChange} />
                  </Grid>

                  {/* Eligibility */}
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={<Checkbox checked={(formik.values as any).eligibility.registrationCertificateRequired || false} onChange={(e) => formik.setFieldValue('eligibility.registrationCertificateRequired', e.target.checked)} />}
                      label="Registration Certificate Required"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="eligibility.similarProjectMinValue" label="Similar Project Min Value" value={(formik.values as any).eligibility.similarProjectMinValue ?? ''} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth type="number" name="eligibility.turnoverMinAvg" label="Turnover Min Avg" value={(formik.values as any).eligibility.turnoverMinAvg ?? ''} onChange={formik.handleChange} />
                  </Grid>

                  {/* Timeline */}
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" name="timeline.preBidMeeting" label="Pre-bid Meeting" value={(formik.values as any).timeline.preBidMeeting} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" name="timeline.siteVisitStart" label="Site Visit Start" value={(formik.values as any).timeline.siteVisitStart} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" name="timeline.siteVisitEnd" label="Site Visit End" value={(formik.values as any).timeline.siteVisitEnd} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="date" name="timeline.clarificationDeadline" label="Clarification Deadline" value={(formik.values as any).timeline.clarificationDeadline} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth type="datetime-local" name="timeline.bidOpeningDate" label="Bid Opening Date" value={(formik.values as any).timeline.bidOpeningDate} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
                  </Grid>

                  {/* Submission */}
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="submission.documentLink" label="Document Link" value={(formik.values as any).submission.documentLink} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="submission.submissionMode" label="Submission Mode" value={(formik.values as any).submission.submissionMode} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth name="submission.submissionAddress" label="Submission Address" value={(formik.values as any).submission.submissionAddress} onChange={formik.handleChange} />
                  </Grid>

                  {/* Issuing Authority */}
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="issuingAuthority.organization" label="Organization" value={(formik.values as any).issuingAuthority.organization} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="issuingAuthority.department" label="Department" value={(formik.values as any).issuingAuthority.department} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth name="issuingAuthority.address" label="Address" value={(formik.values as any).issuingAuthority.address} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth name="issuingAuthority.tenderLocation" label="Tender Location" value={(formik.values as any).issuingAuthority.tenderLocation} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth name="issuingAuthority.languageOfBids" label="Language of Bids" value={(formik.values as any).issuingAuthority.languageOfBids} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth name="issuingAuthority.governingLaw" label="Governing Law" value={(formik.values as any).issuingAuthority.governingLaw} onChange={formik.handleChange} />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" name="financials.bidValidityDays" label="Bid Validity (days)" value={(formik.values as any).financials.bidValidityDays} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" name="financials.bidSecurityAmount" label="Bid Security Amount" value={(formik.values as any).financials.bidSecurityAmount} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" name="financials.contractPeriodDays" label="Contract Period (days)" value={(formik.values as any).financials.contractPeriodDays} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" name="financials.performanceSecurityPercent" label="Performance Security (%)" value={(formik.values as any).financials.performanceSecurityPercent} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth name="financials.paymentTerms" label="Payment Terms" value={(formik.values as any).financials.paymentTerms} onChange={formik.handleChange} />
              </Grid>

              {/* Scope */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="scope.standards"
                  label="Standards (comma separated)"
                  value={((formik.values as any).scope.standards as string[]).join(', ')}
                  onChange={(e) =>
                    formik.setFieldValue(
                      'scope.standards',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="scope.earthworkExcavationCuM" label="Earthwork (CuM)" value={(formik.values as any).scope.earthworkExcavationCuM ?? ''} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="scope.concreteM35SqM" label="Concrete M35 (SqM)" value={(formik.values as any).scope.concreteM35SqM ?? ''} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="scope.rccCulvertsCount" label="RCC Culverts (count)" value={(formik.values as any).scope.rccCulvertsCount ?? ''} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="scope.stormWaterDrainKm" label="Storm Water Drain (km)" value={(formik.values as any).scope.stormWaterDrainKm ?? ''} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="scope.warrantyMonths" label="Warranty (months)" value={(formik.values as any).scope.warrantyMonths ?? ''} onChange={formik.handleChange} />
              </Grid>

              {/* Eligibility */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Checkbox checked={(formik.values as any).eligibility.registrationCertificateRequired || false} onChange={(e) => formik.setFieldValue('eligibility.registrationCertificateRequired', e.target.checked)} />}
                  label="Registration Certificate Required"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="eligibility.similarProjectMinValue" label="Similar Project Min Value" value={(formik.values as any).eligibility.similarProjectMinValue ?? ''} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" name="eligibility.turnoverMinAvg" label="Turnover Min Avg" value={(formik.values as any).eligibility.turnoverMinAvg ?? ''} onChange={formik.handleChange} />
              </Grid>

              {/* Timeline */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" name="timeline.preBidMeeting" label="Pre-bid Meeting" value={(formik.values as any).timeline.preBidMeeting} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" name="timeline.siteVisitStart" label="Site Visit Start" value={(formik.values as any).timeline.siteVisitStart} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" name="timeline.siteVisitEnd" label="Site Visit End" value={(formik.values as any).timeline.siteVisitEnd} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="date" name="timeline.clarificationDeadline" label="Clarification Deadline" value={(formik.values as any).timeline.clarificationDeadline} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="datetime-local" name="timeline.bidOpeningDate" label="Bid Opening Date" value={(formik.values as any).timeline.bidOpeningDate} onChange={formik.handleChange} InputLabelProps={{ shrink: true }} />
              </Grid>

              {/* Submission */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth name="submission.documentLink" label="Document Link" value={(formik.values as any).submission.documentLink} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth name="submission.submissionMode" label="Submission Mode" value={(formik.values as any).submission.submissionMode} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth name="submission.submissionAddress" label="Submission Address" value={(formik.values as any).submission.submissionAddress} onChange={formik.handleChange} />
              </Grid>

              {/* Issuing Authority */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth name="issuingAuthority.organization" label="Organization" value={(formik.values as any).issuingAuthority.organization} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth name="issuingAuthority.department" label="Department" value={(formik.values as any).issuingAuthority.department} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth name="issuingAuthority.address" label="Address" value={(formik.values as any).issuingAuthority.address} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth name="issuingAuthority.tenderLocation" label="Tender Location" value={(formik.values as any).issuingAuthority.tenderLocation} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth name="issuingAuthority.languageOfBids" label="Language of Bids" value={(formik.values as any).issuingAuthority.languageOfBids} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth name="issuingAuthority.governingLaw" label="Governing Law" value={(formik.values as any).issuingAuthority.governingLaw} onChange={formik.handleChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!formik.dirty || !formik.isValid}
            >
              {selectedTender ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tender? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}