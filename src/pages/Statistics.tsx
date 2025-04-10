import { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchStatistics } from '../store/slices/agencySlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const statusColors = {
  OPEN: '#4CAF50',
  CLOSED: '#F44336',
  CANCELLED: '#9E9E9E',
};

export default function Statistics() {
  const dispatch = useAppDispatch();
  const { statistics, loading, error } = useAppSelector((state) => state.agency);

  useEffect(() => {
    // In production, get the agencyId from auth context/state
    const agencyId = 1;
    dispatch(fetchStatistics(agencyId));
  }, [dispatch]);

  const pieChartData = {
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

  const barChartData = {
    labels: ['Total', 'Open', 'Closed', 'Cancelled'],
    datasets: [
      {
        label: 'Number of Tenders',
        data: [
          statistics?.totalTenders || 0,
          statistics?.openTenders || 0,
          statistics?.closedTenders || 0,
          statistics?.cancelledTenders || 0,
        ],
        backgroundColor: [
          '#2196F3',
          statusColors.OPEN,
          statusColors.CLOSED,
          statusColors.CANCELLED,
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
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
      <Typography variant="h4" mb={4}>
        Statistics Overview
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tenders"
            value={statistics?.totalTenders || 0}
            icon={FileText}
            color="#2196F3"
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
              <Typography variant="h6" mb={3}>
                Tender Distribution
              </Typography>
              <Box height={400}>
                <Bar data={barChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3}>
                Status Distribution
              </Typography>
              <Box height={400}>
                <Doughnut data={pieChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}