// src/pages/accounts.tsx
import { useEffect, useState } from 'react';
import { Plus, Unplug, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { platforms } from '../assets/platforms';

interface Account {
  _id: string;
  platform: string;
  handle: string;
  status: 'connected' | 'disconnected';
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await API.get('/accounts');
      setAccounts(response.data);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      const response = await API.get(`/oath/${platform}/url`);
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(`Failed to connect ${platform}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await API.delete(`/accounts/${accountId}`);
      toast.success('Account disconnected');
      fetchAccounts();
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Connected Accounts</h1>
          <p className="text-gray-600 mt-1">{accounts.length} accounts connected</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Connect Account
        </button>
      </div>

      {/* Platform Picker Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Choose a platform</h2>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {platforms.map((platform: any) => {
                const isConnected = accounts.some(a => a.platform === platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => {
                      handleConnect(platform.id);
                      setShowModal(false);
                    }}
                    disabled={isConnected || connecting === platform.id}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      isConnected
                        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-gray-600">{platform.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No accounts connected</h3>
          <p className="text-gray-600 mt-2">Connect your first account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div key={account._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">@{account.handle}</p>
                  <p className="text-sm text-gray-600">{account.platform}</p>
                </div>
                {account.status === 'connected' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <button
                onClick={() => handleDisconnect(account._id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Unplug className="w-4 h-4" />
                Disconnect 
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}