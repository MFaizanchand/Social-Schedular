// src/pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, Clock, Users } from 'lucide-react';
// import API from '@/api/axios';
// import { useO } from '@/context/o-context';

interface DashboardStats {
  scheduled: number;
  published: number;
  connectedAccounts: number;
}

interface Activity {
  _id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
//   const { user } = useO();
const user = {name : "Faizan" , email:"user@gmail.com"}
  const [stats, setStats] = useState<DashboardStats>({
    scheduled: 0,
    published: 0,
    connectedAccounts: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [postsRes, accountsRes, activitiesRes] = await Promise.all([
          API.get('/ai/posts'),
          API.get('/ai/accounts'),
          API.get('/ai/activity'),
        ]);

        const posts = postsRes.data || [];
        const accounts = accountsRes.data || [];
        const activities = activitiesRes.data || [];

        setStats({
          scheduled: posts.filter((p: any) => p.status === 'scheduled').length,
          published: posts.filter((p: any) => p.status === 'published').length,
          connectedAccounts: accounts.filter((a: any) => a.status === 'connected').length,
        });

        setActivities(activities.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Good morning, {user?.name}! 👋
        </h2>
        <p className="text-gray-600 mt-2">
          Track your social media posts and manage your accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label: 'Scheduled Posts',
            value: stats.scheduled,
            icon: Clock,
            trend: '+2 today',
            color: 'blue',
          },
          {
            label: 'Published Posts',
            value: stats.published,
            icon: CheckCircle,
            trend: 'All time',
            color: 'green',
          },
          {
            label: 'Connected Accounts',
            value: stats.connectedAccounts,
            icon: Users,
            trend: 'Active',
            color: 'purple',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <Icon className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {activities.length} events
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No activity yet</p>
            <p className="text-sm text-gray-500">
              Connect accounts and schedule posts to see events here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {activity.activityType}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}