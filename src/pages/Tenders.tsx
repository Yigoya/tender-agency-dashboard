import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, Maximize2, Minimize2, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchTenders } from '../store/slices/tenderSlice';
import { adminApi, tenderApi } from '../services/api';
import type { ServiceNode, Tender, TenderCreate } from '../types/api';

type OptionalTenderField =
  | 'noticeNumber'
  | 'productCategory'
  | 'tenderType'
  | 'procurementMethod'
  | 'costOfTenderDocument'
  | 'bidValidity'
  | 'bidSecurity'
  | 'contractPeriod'
  | 'performanceSecurity'
  | 'paymentTerms'
  | 'keyDeliverables'
  | 'technicalSpecifications'
  | 'questionDeadline'
  | 'tenderReferenceNoticeNo'
  | 'publishedOn'
  | 'bidSubmissionDeadline'
  | 'tenderNoticeCode'
  | 'warranty'
  | 'generalEligibility'
  | 'technicalRequirements'
  | 'financialRequirements'
  | 'experience'
  | 'preBidMeeting'
  | 'siteVisit'
  | 'deadlineForClarifications'
  | 'bidOpeningDate'
  | 'tenderDocumentCollectionLocation'
  | 'tenderDocumentCollectionTime'
  | 'tenderDocumentDownload'
  | 'bidSubmissionMode'
  | 'bidSubmissionAddress'
  | 'organization'
  | 'department'
  | 'address'
  | 'tenderLocation'
  | 'languageOfBids'
  | 'validityPeriodOfBids'
  | 'governingLaw';

const TENDER_DRAFT_STORAGE_KEY = 'tender-create-draft';

const optionalText = () =>
  yup
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .notRequired();

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  closingDate: yup.string().required('Closing date is required'),
  contactInfo: yup.string().required('Contact information is required'),
  serviceId: yup.number().positive('Select a service').required('Service is required'),
  status: yup.mixed<'OPEN' | 'CLOSED' | 'CANCELLED'>().oneOf(['OPEN', 'CLOSED', 'CANCELLED']).required(),
  isFree: yup.boolean().required(),
  referenceNumber: yup.string().trim().required('Reference number is required'),
  noticeNumber: optionalText(),
  productCategory: optionalText(),
  tenderType: optionalText(),
  procurementMethod: optionalText(),
  costOfTenderDocument: optionalText(),
  bidValidity: optionalText(),
  bidSecurity: optionalText(),
  contractPeriod: optionalText(),
  performanceSecurity: optionalText(),
  paymentTerms: optionalText(),
  keyDeliverables: optionalText(),
  technicalSpecifications: optionalText(),
  questionDeadline: optionalText(),
  tenderReferenceNoticeNo: optionalText(),
  publishedOn: optionalText(),
  bidSubmissionDeadline: optionalText(),
  tenderNoticeCode: optionalText(),
  warranty: optionalText(),
  generalEligibility: optionalText(),
  technicalRequirements: optionalText(),
  financialRequirements: optionalText(),
  experience: optionalText(),
  preBidMeeting: optionalText(),
  siteVisit: optionalText(),
  deadlineForClarifications: optionalText(),
  bidOpeningDate: optionalText(),
  tenderDocumentCollectionLocation: optionalText(),
  tenderDocumentCollectionTime: optionalText(),
  tenderDocumentDownload: optionalText(),
  bidSubmissionMode: optionalText(),
  bidSubmissionAddress: optionalText(),
  organization: optionalText(),
  department: optionalText(),
  address: optionalText(),
  tenderLocation: optionalText(),
  languageOfBids: optionalText(),
  validityPeriodOfBids: optionalText(),
  governingLaw: optionalText(),
});

type TenderFormValues = yup.InferType<typeof validationSchema>;

const defaultFormValues: TenderFormValues = {
  title: '',
  description: '',
  location: '',
  closingDate: '',
  contactInfo: '',
  serviceId: 0,
  status: 'OPEN',
  isFree: false,
  referenceNumber: '',
  noticeNumber: '',
  productCategory: '',
  tenderType: '',
  procurementMethod: '',
  costOfTenderDocument: '',
  bidValidity: '',
  bidSecurity: '',
  contractPeriod: '',
  performanceSecurity: '',
  paymentTerms: '',
  keyDeliverables: '',
  technicalSpecifications: '',
  questionDeadline: '',
  tenderReferenceNoticeNo: '',
  publishedOn: '',
  bidSubmissionDeadline: '',
  tenderNoticeCode: '',
  warranty: '',
  generalEligibility: '',
  technicalRequirements: '',
  financialRequirements: '',
  experience: '',
  preBidMeeting: '',
  siteVisit: '',
  deadlineForClarifications: '',
  bidOpeningDate: '',
  tenderDocumentCollectionLocation: '',
  tenderDocumentCollectionTime: '',
  tenderDocumentDownload: '',
  bidSubmissionMode: '',
  bidSubmissionAddress: '',
  organization: '',
  department: '',
  address: '',
  tenderLocation: '',
  languageOfBids: '',
  validityPeriodOfBids: '',
  governingLaw: '',
};

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

const normaliseDateTimeInput = (value?: string) => {
  if (!value) return '';
  return value.length >= 16 ? value.slice(0, 16) : value;
};

const ensureSecondsPrecision = (value: string) => {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
};

const mapTenderToForm = (tender: Tender): TenderFormValues => ({
  title: tender.title ?? '',
  description: tender.description ?? '',
  location: tender.location ?? '',
  closingDate: normaliseDateTimeInput(tender.closingDate),
  contactInfo: tender.contactInfo ?? '',
  serviceId: tender.serviceId ?? tender.categoryId ?? 0,
  status: tender.status ?? 'OPEN',
  isFree: tender.isFree ?? false,
  referenceNumber: tender.referenceNumber ?? '',
  noticeNumber: tender.noticeNumber ?? '',
  productCategory: tender.productCategory ?? '',
  tenderType: tender.tenderType ?? '',
  procurementMethod: tender.procurementMethod ?? '',
  costOfTenderDocument: tender.costOfTenderDocument ?? '',
  bidValidity: tender.bidValidity ?? '',
  bidSecurity: tender.bidSecurity ?? '',
  contractPeriod: tender.contractPeriod ?? '',
  performanceSecurity: tender.performanceSecurity ?? '',
  paymentTerms: tender.paymentTerms ?? '',
  keyDeliverables: tender.keyDeliverables ?? '',
  technicalSpecifications: tender.technicalSpecifications ?? '',
  questionDeadline: normaliseDateTimeInput(tender.questionDeadline),
  tenderReferenceNoticeNo: tender.tenderReferenceNoticeNo ?? '',
  publishedOn: normaliseDateTimeInput(tender.publishedOn),
  bidSubmissionDeadline: normaliseDateTimeInput(tender.bidSubmissionDeadline),
  tenderNoticeCode: tender.tenderNoticeCode ?? '',
  warranty: tender.warranty ?? '',
  generalEligibility: tender.generalEligibility ?? '',
  technicalRequirements: tender.technicalRequirements ?? '',
  financialRequirements: tender.financialRequirements ?? '',
  experience: tender.experience ?? '',
  preBidMeeting: normaliseDateTimeInput(tender.preBidMeeting),
  siteVisit: tender.siteVisit ?? '',
  deadlineForClarifications: normaliseDateTimeInput(tender.deadlineForClarifications),
  bidOpeningDate: normaliseDateTimeInput(tender.bidOpeningDate),
  tenderDocumentCollectionLocation: tender.tenderDocumentCollectionLocation ?? '',
  tenderDocumentCollectionTime: tender.tenderDocumentCollectionTime ?? '',
  tenderDocumentDownload: tender.tenderDocumentDownload ?? '',
  bidSubmissionMode: tender.bidSubmissionMode ?? '',
  bidSubmissionAddress: tender.bidSubmissionAddress ?? '',
  organization: tender.organization ?? '',
  department: tender.department ?? '',
  address: tender.address ?? '',
  tenderLocation: tender.tenderLocation ?? '',
  languageOfBids: tender.languageOfBids ?? '',
  validityPeriodOfBids: tender.validityPeriodOfBids ?? '',
  governingLaw: tender.governingLaw ?? '',
});

const buildPayload = (values: TenderFormValues): TenderCreate => {
  const payload: TenderCreate = {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    closingDate: ensureSecondsPrecision(values.closingDate),
    contactInfo: values.contactInfo.trim(),
    serviceId: values.serviceId,
    status: values.status,
    isFree: values.isFree,
    referenceNumber: values.referenceNumber.trim(),
  };

  const optionalAssignments: Array<[OptionalTenderField, string | undefined]> = [
    ['noticeNumber', values.noticeNumber],
    ['productCategory', values.productCategory],
    ['tenderType', values.tenderType],
    ['procurementMethod', values.procurementMethod],
    ['costOfTenderDocument', values.costOfTenderDocument],
    ['bidValidity', values.bidValidity],
    ['bidSecurity', values.bidSecurity],
    ['contractPeriod', values.contractPeriod],
    ['performanceSecurity', values.performanceSecurity],
    ['paymentTerms', values.paymentTerms],
    ['keyDeliverables', values.keyDeliverables],
    ['technicalSpecifications', values.technicalSpecifications],
    ['questionDeadline', values.questionDeadline],
    ['tenderReferenceNoticeNo', values.tenderReferenceNoticeNo],
    ['publishedOn', values.publishedOn],
    ['bidSubmissionDeadline', values.bidSubmissionDeadline],
    ['tenderNoticeCode', values.tenderNoticeCode],
    ['warranty', values.warranty],
    ['generalEligibility', values.generalEligibility],
    ['technicalRequirements', values.technicalRequirements],
    ['financialRequirements', values.financialRequirements],
    ['experience', values.experience],
    ['preBidMeeting', values.preBidMeeting],
    ['siteVisit', values.siteVisit],
    ['deadlineForClarifications', values.deadlineForClarifications],
    ['bidOpeningDate', values.bidOpeningDate],
    ['tenderDocumentCollectionLocation', values.tenderDocumentCollectionLocation],
    ['tenderDocumentCollectionTime', values.tenderDocumentCollectionTime],
    ['tenderDocumentDownload', values.tenderDocumentDownload],
    ['bidSubmissionMode', values.bidSubmissionMode],
    ['bidSubmissionAddress', values.bidSubmissionAddress],
    ['organization', values.organization],
    ['department', values.department],
    ['address', values.address],
    ['tenderLocation', values.tenderLocation],
    ['languageOfBids', values.languageOfBids],
    ['validityPeriodOfBids', values.validityPeriodOfBids],
    ['governingLaw', values.governingLaw],
  ];

  const dateTimeFields: OptionalTenderField[] = [
    'questionDeadline',
    'publishedOn',
    'bidSubmissionDeadline',
    'preBidMeeting',
    'deadlineForClarifications',
    'bidOpeningDate',
  ];

  optionalAssignments.forEach(([key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) {
      const normalised = dateTimeFields.includes(key) ? ensureSecondsPrecision(trimmed) : trimmed;
      (payload as Record<string, string>)[key] = normalised;
    }
  });

  return payload;
};

const truncateText = (value: string | undefined, maxLength = 80) => {
  if (!value) return '-';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
};

export default function Tenders() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tenders, loading, error } = useAppSelector((state) => state.tender);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceTree, setServiceTree] = useState<ServiceNode[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDialogExpanded, setIsDialogExpanded] = useState(false);

  useEffect(() => {
    const agencyId = 1;
    dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
  }, [dispatch, page, rowsPerPage]);

  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const { data } = await adminApi.getServices();
        const tenderCategory = data.find((category) => category.categoryId === 1);
        if (!tenderCategory) {
          toast.error('Tender services not found');
          setServiceTree([]);
          return;
        }
        setServiceTree(tenderCategory.services || []);
      } catch (err) {
        console.error('Failed to load services', err);
        toast.error('Failed to load services');
      } finally {
        setServicesLoading(false);
      }
    };
    loadServices();
  }, []);

  const serviceLookup = useMemo(() => {
    const map = new Map<number, { breadcrumb: string; node: ServiceNode }>();
    const traverse = (nodes: ServiceNode[] = [], trail: string[] = []) => {
      nodes.forEach((node) => {
        const currentTrail = [...trail, node.name];
        map.set(node.serviceId, {
          breadcrumb: currentTrail.join(' / '),
          node,
        });
        if (node.services?.length) {
          traverse(node.services, currentTrail);
        }
      });
    };
    traverse(serviceTree);
    return map;
  }, [serviceTree]);

  const renderServiceMenuItems = useCallback(() => {
    const buildItems = (nodes: ServiceNode[] = [], depth = 0, trail: string[] = []) =>
      nodes.flatMap((node) => {
        const currentTrail = [...trail, node.name];
        const items = [
          <MenuItem
            key={node.serviceId}
            value={node.serviceId}
            sx={{ pl: 2 + depth * 2, fontWeight: depth === 0 ? 600 : 400 }}
          >
            {currentTrail.join(' / ')}
          </MenuItem>,
        ];
        if (node.services?.length) {
          items.push(...buildItems(node.services, depth + 1, currentTrail));
        }
        return items;
      });

    return buildItems(serviceTree, 0, []);
  }, [serviceTree]);

  const formik = useFormik<TenderFormValues>({
    initialValues: defaultFormValues,
    validationSchema,
    enableReinitialize: false,
    validateOnMount: true,
    onSubmit: async (values, helpers) => {
      try {
        const agencyId = 1;
        const payload = buildPayload(values);
        if (selectedTenderId) {
          await tenderApi.update(agencyId, selectedTenderId, payload);
          toast.success('Tender updated successfully');
        } else {
          const { data } = await tenderApi.create(agencyId, payload);
          if (file) {
            try {
              await tenderApi.uploadDocument(agencyId, data.id, file);
              toast.success('Tender and file uploaded successfully');
            } catch (uploadError) {
              console.error(uploadError);
              toast.warn('Tender created, but file upload failed');
            }
          } else {
            toast.success('Tender created successfully');
          }
        }
        dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
        helpers.resetForm({ values: defaultFormValues });
        setFile(null);
        setOpenDialog(false);
        setSelectedTenderId(null);
        setIsDialogExpanded(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TENDER_DRAFT_STORAGE_KEY);
        }
      } catch (submitError) {
        toast.error(selectedTenderId ? 'Failed to update tender' : 'Failed to create tender');
      }
    },
  });

  useEffect(() => {
    if (!openDialog || selectedTenderId) return;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TENDER_DRAFT_STORAGE_KEY, JSON.stringify(formik.values));
    } catch (persistError) {
      console.warn('Failed to persist tender draft', persistError);
    }
  }, [formik.values, openDialog, selectedTenderId]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (tenderId?: number) => {
    if (tenderId) {
      const tenderToEdit = tenders.find((t) => t.id === tenderId);
      if (tenderToEdit) {
        formik.setValues(mapTenderToForm(tenderToEdit), true);
        formik.setTouched({}, false);
        setSelectedTenderId(tenderId);
        setFile(null);
      }
    } else {
      try {
        const storedDraft = typeof window !== 'undefined' ? localStorage.getItem(TENDER_DRAFT_STORAGE_KEY) : null;
        if (storedDraft) {
          const parsedDraft = JSON.parse(storedDraft) as TenderFormValues;
          formik.setValues({ ...defaultFormValues, ...parsedDraft }, false);
          formik.setTouched({}, false);
        } else {
          formik.setValues(defaultFormValues, false);
          formik.setTouched({}, false);
        }
      } catch (draftError) {
        console.warn('Failed to load tender draft', draftError);
        formik.setValues(defaultFormValues, false);
        formik.setTouched({}, false);
      }
      setSelectedTenderId(null);
    }
    setIsDialogExpanded(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTenderId(null);
    setIsDialogExpanded(false);
  };

  const handleDeleteClick = (tenderId: number) => {
    setSelectedTenderId(tenderId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTenderId) return;
    try {
      const agencyId = 1;
      await tenderApi.delete(agencyId, selectedTenderId);
      dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
      toast.success('Tender deleted successfully');
    } catch (deleteError) {
      toast.error('Failed to delete tender');
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedTenderId(null);
    }
  };

  const safeFormatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return '-';
    return format(parsed, 'MMM d, yyyy');
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
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Closing Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenders.map((tender) => {
                  const StatusIcon = statusIcons[tender.status];
                  const serviceOption = serviceLookup.get(tender.serviceId ?? tender.categoryId ?? 0);
                  return (
                    <TableRow
                      key={tender.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tenders/${tender.id}`)}
                    >
                      <TableCell>{tender.title || '-'}</TableCell>
                      <TableCell>{truncateText(tender.description, 100)}</TableCell>
                      <TableCell>{tender.location || '-'}</TableCell>
                      <TableCell>
                        {serviceOption?.breadcrumb ??
                          (typeof tender.serviceId === 'number'
                            ? `Service #${tender.serviceId}`
                            : 'Not provided')}
                      </TableCell>
                      <TableCell>{safeFormatDate(tender.closingDate)}</TableCell>
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
                      <TableCell>{tender.referenceNumber || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDialog(tender.id);
                          }}
                        >
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(event) => {
                            event.stopPropagation();
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
            count={tenders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth={isDialogExpanded ? 'xl' : 'md'}
        fullWidth
        keepMounted
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <Typography variant="h6">{selectedTenderId ? 'Edit Tender' : 'Create New Tender'}</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={() => setIsDialogExpanded((prev) => !prev)}
                aria-label={isDialogExpanded ? 'Restore dialog size' : 'Expand dialog'}
              >
                {isDialogExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </IconButton>
              <IconButton size="small" onClick={handleCloseDialog} aria-label="Close dialog">
                <X size={18} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Fields marked * are required. Please provide Title, Description, Location, Closing Date, Contact Info, Tender Service, Status, and Reference Number.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="title"
                  label="Title"
                  required
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
                  minRows={3}
                  name="description"
                  label="Description"
                  required
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
                  required
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={formik.touched.location && Boolean(formik.errors.location)}
                  helperText={formik.touched.location && formik.errors.location}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="closingDate"
                  label="Closing Date"
                  InputLabelProps={{ shrink: true }}
                  required
                  value={formik.values.closingDate}
                  onChange={formik.handleChange}
                  error={formik.touched.closingDate && Boolean(formik.errors.closingDate)}
                  helperText={formik.touched.closingDate && formik.errors.closingDate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="contactInfo"
                  label="Contact Info"
                  required
                  value={formik.values.contactInfo}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo && Boolean(formik.errors.contactInfo)}
                  helperText={formik.touched.contactInfo && formik.errors.contactInfo}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  name="serviceId"
                  label="Tender Service"
                  required
                  value={formik.values.serviceId}
                  onChange={(event) => formik.setFieldValue('serviceId', Number(event.target.value))}
                  error={formik.touched.serviceId && Boolean(formik.errors.serviceId)}
                  helperText={
                    servicesLoading
                      ? 'Loading services…'
                      : (formik.touched.serviceId && formik.errors.serviceId) ||
                        'Choose a nested service from the Tender catalogue'
                  }
                  disabled={servicesLoading}
                >
                  <MenuItem value={0} disabled>
                    {servicesLoading ? 'Loading…' : 'Select a service'}
                  </MenuItem>
                  {!servicesLoading &&
                    !serviceLookup.has(formik.values.serviceId) &&
                    formik.values.serviceId !== 0 && (
                      <MenuItem value={formik.values.serviceId}>
                        Current service (ID: {formik.values.serviceId})
                      </MenuItem>
                    )}
                  {renderServiceMenuItems()}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.isFree}
                      onChange={(event) => formik.setFieldValue('isFree', event.target.checked)}
                    />
                  }
                  label="This tender is free"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="status"
                  label="Status"
                  select
                  required
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                >
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" fullWidth>
                  {file ? `Selected: ${file.name}` : 'Upload Document'}
                  <input
                    hidden
                    type="file"
                    onChange={(event) => {
                      const selectedFile = event.currentTarget.files?.[0] ?? null;
                      setFile(selectedFile);
                    }}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="questionDeadline"
                  label="Question Deadline"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.questionDeadline}
                  onChange={formik.handleChange}
                  error={formik.touched.questionDeadline && Boolean(formik.errors.questionDeadline)}
                  helperText={formik.touched.questionDeadline && formik.errors.questionDeadline}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="publishedOn"
                  label="Published On"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.publishedOn}
                  onChange={formik.handleChange}
                  error={formik.touched.publishedOn && Boolean(formik.errors.publishedOn)}
                  helperText={formik.touched.publishedOn && formik.errors.publishedOn}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="bidSubmissionDeadline"
                  label="Bid Submission Deadline"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.bidSubmissionDeadline}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.bidSubmissionDeadline && Boolean(formik.errors.bidSubmissionDeadline)
                  }
                  helperText={
                    formik.touched.bidSubmissionDeadline && formik.errors.bidSubmissionDeadline
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="bidOpeningDate"
                  label="Bid Opening Date"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.bidOpeningDate}
                  onChange={formik.handleChange}
                  error={formik.touched.bidOpeningDate && Boolean(formik.errors.bidOpeningDate)}
                  helperText={formik.touched.bidOpeningDate && formik.errors.bidOpeningDate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="preBidMeeting"
                  label="Pre-Bid Meeting"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.preBidMeeting}
                  onChange={formik.handleChange}
                  error={formik.touched.preBidMeeting && Boolean(formik.errors.preBidMeeting)}
                  helperText={formik.touched.preBidMeeting && formik.errors.preBidMeeting}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="deadlineForClarifications"
                  label="Deadline for Clarifications"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.deadlineForClarifications}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.deadlineForClarifications &&
                    Boolean(formik.errors.deadlineForClarifications)
                  }
                  helperText={
                    formik.touched.deadlineForClarifications &&
                    formik.errors.deadlineForClarifications
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="referenceNumber"
                  label="Reference Number"
                  required
                  value={formik.values.referenceNumber}
                  onChange={formik.handleChange}
                  error={formik.touched.referenceNumber && Boolean(formik.errors.referenceNumber)}
                  helperText={formik.touched.referenceNumber && formik.errors.referenceNumber}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="noticeNumber"
                  label="Notice Number"
                  value={formik.values.noticeNumber}
                  onChange={formik.handleChange}
                  error={formik.touched.noticeNumber && Boolean(formik.errors.noticeNumber)}
                  helperText={formik.touched.noticeNumber && formik.errors.noticeNumber}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderReferenceNoticeNo"
                  label="Tender Reference Notice No."
                  value={formik.values.tenderReferenceNoticeNo}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tenderReferenceNoticeNo &&
                    Boolean(formik.errors.tenderReferenceNoticeNo)
                  }
                  helperText={
                    formik.touched.tenderReferenceNoticeNo &&
                    formik.errors.tenderReferenceNoticeNo
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderNoticeCode"
                  label="Tender Notice Code"
                  value={formik.values.tenderNoticeCode}
                  onChange={formik.handleChange}
                  error={formik.touched.tenderNoticeCode && Boolean(formik.errors.tenderNoticeCode)}
                  helperText={formik.touched.tenderNoticeCode && formik.errors.tenderNoticeCode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="productCategory"
                  label="Product Category"
                  value={formik.values.productCategory}
                  onChange={formik.handleChange}
                  error={formik.touched.productCategory && Boolean(formik.errors.productCategory)}
                  helperText={formik.touched.productCategory && formik.errors.productCategory}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderType"
                  label="Tender Type"
                  value={formik.values.tenderType}
                  onChange={formik.handleChange}
                  error={formik.touched.tenderType && Boolean(formik.errors.tenderType)}
                  helperText={formik.touched.tenderType && formik.errors.tenderType}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="procurementMethod"
                  label="Procurement Method"
                  value={formik.values.procurementMethod}
                  onChange={formik.handleChange}
                  error={formik.touched.procurementMethod && Boolean(formik.errors.procurementMethod)}
                  helperText={formik.touched.procurementMethod && formik.errors.procurementMethod}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="costOfTenderDocument"
                  label="Cost of Tender Document"
                  value={formik.values.costOfTenderDocument}
                  onChange={formik.handleChange}
                  error={formik.touched.costOfTenderDocument && Boolean(formik.errors.costOfTenderDocument)}
                  helperText={formik.touched.costOfTenderDocument && formik.errors.costOfTenderDocument}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="bidValidity"
                  label="Bid Validity"
                  value={formik.values.bidValidity}
                  onChange={formik.handleChange}
                  error={formik.touched.bidValidity && Boolean(formik.errors.bidValidity)}
                  helperText={formik.touched.bidValidity && formik.errors.bidValidity}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="bidSecurity"
                  label="Bid Security"
                  value={formik.values.bidSecurity}
                  onChange={formik.handleChange}
                  error={formik.touched.bidSecurity && Boolean(formik.errors.bidSecurity)}
                  helperText={formik.touched.bidSecurity && formik.errors.bidSecurity}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="contractPeriod"
                  label="Contract Period"
                  value={formik.values.contractPeriod}
                  onChange={formik.handleChange}
                  error={formik.touched.contractPeriod && Boolean(formik.errors.contractPeriod)}
                  helperText={formik.touched.contractPeriod && formik.errors.contractPeriod}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="performanceSecurity"
                  label="Performance Security"
                  value={formik.values.performanceSecurity}
                  onChange={formik.handleChange}
                  error={formik.touched.performanceSecurity && Boolean(formik.errors.performanceSecurity)}
                  helperText={formik.touched.performanceSecurity && formik.errors.performanceSecurity}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="paymentTerms"
                  label="Payment Terms"
                  value={formik.values.paymentTerms}
                  onChange={formik.handleChange}
                  error={formik.touched.paymentTerms && Boolean(formik.errors.paymentTerms)}
                  helperText={formik.touched.paymentTerms && formik.errors.paymentTerms}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Submission Logistics</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderDocumentCollectionLocation"
                  label="Document Collection Location"
                  value={formik.values.tenderDocumentCollectionLocation}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tenderDocumentCollectionLocation &&
                    Boolean(formik.errors.tenderDocumentCollectionLocation)
                  }
                  helperText={
                    formik.touched.tenderDocumentCollectionLocation &&
                    formik.errors.tenderDocumentCollectionLocation
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderDocumentCollectionTime"
                  label="Document Collection Time"
                  value={formik.values.tenderDocumentCollectionTime}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tenderDocumentCollectionTime &&
                    Boolean(formik.errors.tenderDocumentCollectionTime)
                  }
                  helperText={
                    formik.touched.tenderDocumentCollectionTime &&
                    formik.errors.tenderDocumentCollectionTime
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="url"
                  name="tenderDocumentDownload"
                  label="Document Download Link"
                  value={formik.values.tenderDocumentDownload}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.tenderDocumentDownload &&
                    Boolean(formik.errors.tenderDocumentDownload)
                  }
                  helperText={
                    formik.touched.tenderDocumentDownload &&
                    formik.errors.tenderDocumentDownload
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="bidSubmissionMode"
                  label="Bid Submission Mode"
                  value={formik.values.bidSubmissionMode}
                  onChange={formik.handleChange}
                  error={formik.touched.bidSubmissionMode && Boolean(formik.errors.bidSubmissionMode)}
                  helperText={formik.touched.bidSubmissionMode && formik.errors.bidSubmissionMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="bidSubmissionAddress"
                  label="Bid Submission Address"
                  multiline
                  minRows={2}
                  value={formik.values.bidSubmissionAddress}
                  onChange={formik.handleChange}
                  error={formik.touched.bidSubmissionAddress && Boolean(formik.errors.bidSubmissionAddress)}
                  helperText={formik.touched.bidSubmissionAddress && formik.errors.bidSubmissionAddress}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="siteVisit"
                  label="Site Visit Details"
                  multiline
                  minRows={2}
                  value={formik.values.siteVisit}
                  onChange={formik.handleChange}
                  error={formik.touched.siteVisit && Boolean(formik.errors.siteVisit)}
                  helperText={formik.touched.siteVisit && formik.errors.siteVisit}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Eligibility & Requirements</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="generalEligibility"
                  label="General Eligibility"
                  multiline
                  minRows={2}
                  value={formik.values.generalEligibility}
                  onChange={formik.handleChange}
                  error={formik.touched.generalEligibility && Boolean(formik.errors.generalEligibility)}
                  helperText={formik.touched.generalEligibility && formik.errors.generalEligibility}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="technicalRequirements"
                  label="Technical Requirements"
                  multiline
                  minRows={2}
                  value={formik.values.technicalRequirements}
                  onChange={formik.handleChange}
                  error={formik.touched.technicalRequirements && Boolean(formik.errors.technicalRequirements)}
                  helperText={
                    formik.touched.technicalRequirements && formik.errors.technicalRequirements
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="financialRequirements"
                  label="Financial Requirements"
                  multiline
                  minRows={2}
                  value={formik.values.financialRequirements}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.financialRequirements && Boolean(formik.errors.financialRequirements)
                  }
                  helperText={
                    formik.touched.financialRequirements && formik.errors.financialRequirements
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="experience"
                  label="Experience Requirements"
                  multiline
                  minRows={2}
                  value={formik.values.experience}
                  onChange={formik.handleChange}
                  error={formik.touched.experience && Boolean(formik.errors.experience)}
                  helperText={formik.touched.experience && formik.errors.experience}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="warranty"
                  label="Warranty"
                  multiline
                  minRows={2}
                  value={formik.values.warranty}
                  onChange={formik.handleChange}
                  error={formik.touched.warranty && Boolean(formik.errors.warranty)}
                  helperText={formik.touched.warranty && formik.errors.warranty}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Organisation Details</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="organization"
                  label="Organization"
                  value={formik.values.organization}
                  onChange={formik.handleChange}
                  error={formik.touched.organization && Boolean(formik.errors.organization)}
                  helperText={formik.touched.organization && formik.errors.organization}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="department"
                  label="Department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  error={formik.touched.department && Boolean(formik.errors.department)}
                  helperText={formik.touched.department && formik.errors.department}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="address"
                  label="Address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="tenderLocation"
                  label="Tender Location"
                  value={formik.values.tenderLocation}
                  onChange={formik.handleChange}
                  error={formik.touched.tenderLocation && Boolean(formik.errors.tenderLocation)}
                  helperText={formik.touched.tenderLocation && formik.errors.tenderLocation}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="languageOfBids"
                  label="Language of Bids"
                  value={formik.values.languageOfBids}
                  onChange={formik.handleChange}
                  error={formik.touched.languageOfBids && Boolean(formik.errors.languageOfBids)}
                  helperText={formik.touched.languageOfBids && formik.errors.languageOfBids}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="validityPeriodOfBids"
                  label="Validity Period of Bids"
                  value={formik.values.validityPeriodOfBids}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.validityPeriodOfBids && Boolean(formik.errors.validityPeriodOfBids)
                  }
                  helperText={
                    formik.touched.validityPeriodOfBids && formik.errors.validityPeriodOfBids
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="governingLaw"
                  label="Governing Law"
                  value={formik.values.governingLaw}
                  onChange={formik.handleChange}
                  error={formik.touched.governingLaw && Boolean(formik.errors.governingLaw)}
                  helperText={formik.touched.governingLaw && formik.errors.governingLaw}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  name="keyDeliverables"
                  label="Key Deliverables"
                  value={formik.values.keyDeliverables}
                  onChange={formik.handleChange}
                  error={formik.touched.keyDeliverables && Boolean(formik.errors.keyDeliverables)}
                  helperText={formik.touched.keyDeliverables && formik.errors.keyDeliverables}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  name="technicalSpecifications"
                  label="Technical Specifications"
                  value={formik.values.technicalSpecifications}
                  onChange={formik.handleChange}
                  error={formik.touched.technicalSpecifications && Boolean(formik.errors.technicalSpecifications)}
                  helperText={formik.touched.technicalSpecifications && formik.errors.technicalSpecifications}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={formik.isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {selectedTenderId ? 'Update' : 'Create'}
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