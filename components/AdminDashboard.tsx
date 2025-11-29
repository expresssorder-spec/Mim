import React from 'react';
import { User } from '../types';
import { Shield, Ban, CheckCircle, Users, MessageSquare, Smartphone, MapPin, Activity, Trash, Unlock } from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  onToggleBlock: (userId: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onToggleBlock, onLogout }) => {
  const totalUsers = users.filter(u => u.role !== 'admin').length;
  const totalMessages = users.reduce((acc, user) => acc + (user.stats?.messagesAnswered || 0), 0);
  const activeUsers = users.filter(u => u.role !== 'admin' && !u.isBlocked).length;

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Admin Navbar */}
      <div className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
                <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Admin Console</h1>
              <p className="text-[10px] text-gray-400">AutoResponda System Control</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Users size={24} />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {activeUsers} Active
                </span>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">{totalUsers}</h3>
             <p className="text-gray-500 text-sm">Total Registered Users</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                    <MessageSquare size={24} />
                </div>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">{totalMessages}</h3>
             <p className="text-gray-500 text-sm">Total Automated Replies Sent</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                    <Activity size={24} />
                </div>
             </div>
             <h3 className="text-3xl font-bold text-gray-800">
                {users.filter(u => u.isConnected).length}
             </h3>
             <p className="text-gray-500 text-sm">Online WhatsApp Sessions</p>
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h2 className="text-lg font-bold text-gray-800">User Management</h2>
             <div className="text-xs text-gray-500">
                Monitor and manage client access
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">User Info</th>
                  <th className="p-4 font-semibold">Location & IP</th>
                  <th className="p-4 font-semibold">Usage Stats</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.filter(u => u.role !== 'admin').length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No users registered yet.</td>
                    </tr>
                ) : (
                    users.filter(u => u.role !== 'admin').map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                            <div className="font-medium text-gray-900">{user.email}</div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                <Smartphone size={12} />
                                {user.phoneNumber || 'Not Linked'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                                ID: {user.metadata?.deviceId || 'N/A'}
                            </div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <MapPin size={14} className="text-red-500" />
                                {user.metadata?.country || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 pl-5">
                                IP: {user.metadata?.ipAddress || '127.0.0.1'}
                            </div>
                        </td>
                        <td className="p-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-600 w-32">
                                    <span>Keywords:</span>
                                    <span className="font-semibold">{user.rules.length}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 w-32">
                                    <span>Replies:</span>
                                    <span className="font-semibold">{user.stats?.messagesAnswered || 0}</span>
                                </div>
                            </div>
                        </td>
                        <td className="p-4">
                            {user.isBlocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                    <Ban size={12} /> Blocked
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    <CheckCircle size={12} /> Active
                                </span>
                            )}
                        </td>
                        <td className="p-4 text-right">
                            <button
                                onClick={() => onToggleBlock(user.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                                    user.isBlocked 
                                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                }`}
                            >
                                {user.isBlocked ? (
                                    <>
                                        <Unlock size={12} /> Unblock
                                    </>
                                ) : (
                                    <>
                                        <Ban size={12} /> Block Mac/IP
                                    </>
                                )}
                            </button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};