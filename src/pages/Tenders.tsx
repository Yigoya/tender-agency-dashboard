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
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchTenders } from '../store/slices/tenderSlice';
import { tenderApi } from '../services/api';

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  closingDate: yup.string().required('Closing date is required'),
  contactInfo: yup.string().required('Contact information is required'),
  serviceId: yup.number().required('Service is required'),
  questionDeadline: yup.string().required('Question deadline is required'),
});

const statusColors = {
  OPEN: '#4CAF50',
  CLOSED: '#F44336',
  CANCELLED: '#9E9E9E',
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

  useEffect(() => {
    // In production, get the agencyId from auth context/state
    const agencyId = 1;
    dispatch(fetchTenders({ agencyId, page, size: rowsPerPage }));
  }, [dispatch, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
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

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      location: '',
      closingDate: '',
      contactInfo: '',
      serviceId: 1,
      questionDeadline: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // In production, get the agencyId from auth context/state
        const agencyId = 1;
        if (selectedTender) {
          await tenderApi.update(agencyId, selectedTender, values);
          toast.success('Tender updated successfully');
        } else {
          await tenderApi.create(agencyId, values);
          toast.success('Tender created successfully');
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
                  <TableCell>Title</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Posted Date</TableCell>
                  <TableCell>Closing Date</TableCell>
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
                      <TableCell>{tender.title}</TableCell>
                      <TableCell>{tender.location}</TableCell>
                      <TableCell>{format(new Date(tender.datePosted), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(tender.closingDate), 'MMM d, yyyy')}</TableCell>
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
                  label="Service"
                  select
                  value={formik.values.serviceId}
                  onChange={formik.handleChange}
                  error={formik.touched.serviceId && Boolean(formik.errors.serviceId)}
                  helperText={formik.touched.serviceId && formik.errors.serviceId}
                >
                  <MenuItem value={1}>Construction</MenuItem>
                  <MenuItem value={2}>Consultancy</MenuItem>
                  <MenuItem value={3}>Supplies</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="closingDate"
                  label="Closing Date"
                  value={formik.values.closingDate}
                  onChange={formik.handleChange}
                  error={formik.touched.closingDate && Boolean(formik.errors.closingDate)}
                  helperText={formik.touched.closingDate && formik.errors.closingDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  name="questionDeadline"
                  label="Question Deadline"
                  value={formik.values.questionDeadline}
                  onChange={formik.handleChange}
                  error={formik.touched.questionDeadline && Boolean(formik.errors.questionDeadline)}
                  helperText={formik.touched.questionDeadline && formik.errors.questionDeadline}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="contactInfo"
                  label="Contact Information"
                  value={formik.values.contactInfo}
                  onChange={formik.handleChange}
                  error={formik.touched.contactInfo && Boolean(formik.errors.contactInfo)}
                  helperText={formik.touched.contactInfo && formik.errors.contactInfo}
                />
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