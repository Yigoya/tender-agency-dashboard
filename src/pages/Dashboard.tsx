import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { format } from 'date-fns';
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchStatistics } from '../store/slices/agencySlice';
import { fetchTenders } from '../store/slices/tenderSlice';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

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

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { statistics } = useAppSelector((state) => state.agency);
  const { tenders } = useAppSelector((state) => state.tender);

  useEffect(() => {
    // In production, get the agencyId from auth context/state
    const agencyId = 1;
    dispatch(fetchStatistics(agencyId));
    dispatch(fetchTenders({ agencyId, page: 0, size: 5 }));
  }, [dispatch]);

  const chartData = {
    labels: ['Open', 'Closed', 'Cancelled'],
    datasets: [
      {
        data: [
          statistics?.openTenders || 0,
          statistics?.closedTenders || 0,
          statistics?.cancelledTenders || 0,
        ],
        backgroundColor: [
          statusColors.OPEN,
          statusColors.CLOSED,
          statusColors.CANCELLED,
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Icon size={24} color={color} />
          <Typography variant="h6" ml={1} color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" mb={4}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tenders"
            value={statistics?.totalTenders || 0}
            icon={FileText}
            color={statusColors.OPEN}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Tenders"
            value={statistics?.openTenders || 0}
            icon={CheckCircle}
            color={statusColors.OPEN}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Closed Tenders"
            value={statistics?.closedTenders || 0}
            icon={XCircle}
            color={statusColors.CLOSED}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancelled Tenders"
            value={statistics?.cancelledTenders || 0}
            icon={AlertCircle}
            color={statusColors.CANCELLED}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Recent Tenders</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/tenders')}
                >
                  View All
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Closing Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenders.slice(0, 5).map((tender) => {
                      const StatusIcon = statusIcons[tender.status];
                      return (
                        <TableRow
                          key={tender.id}
                          hover
                          onClick={() => navigate(`/tenders/${tender.id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{tender.title}</TableCell>
                          <TableCell>{tender.location}</TableCell>
                          <TableCell>
                            {format(new Date(tender.closingDate), 'MMM d, yyyy')}
                          </TableCell>
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={3}>
                Tender Status Distribution
              </Typography>
              <Box height={300}>
                <Doughnut data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}