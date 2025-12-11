import React, { useState } from 'react';
import { X, Plus, Link, Mail, Users, Shield } from 'lucide-react';
import { Dashboard, ShareConfig } from '../types';

// ========================================
// 🆕 CREATE DASHBOARD MODAL
// ========================================
interface CreateDashboardModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a dashboard name');
      return;
    }
    onCreate(name, description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-bold text-gray-800">Create New Dashboard</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dashboard Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q4 Sales Analysis"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help others understand this dashboard..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 🆕 SHARE DASHBOARD MODAL
// ========================================
interface ShareDashboardModalProps {
  dashboard: Dashboard;
  onClose: () => void;
  onShare: (config: ShareConfig) => void;
}

export const ShareDashboardModal: React.FC<ShareDashboardModalProps> = ({ 
  dashboard, 
  onClose, 
  onShare 
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [shareMethod, setShareMethod] = useState<'link' | 'email'>('link');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleAddPerson = () => {
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    const shareConfig: ShareConfig = {
      id: `share-${Date.now()}`,
      email: email.trim(),
      name: name.trim() || undefined,
      permission,
      sharedAt: new Date().toISOString(),
    };

    onShare(shareConfig);
    
    // Reset form
    setEmail('');
    setName('');
    
    if (shareMethod === 'email') {
      alert(`Email invitation sent to ${email}`);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/${dashboard.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const sharedUsers = dashboard.sharedWith || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Share Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">{dashboard.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Add People Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Add people
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="flex gap-2">
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
                
                <button
                  onClick={handleAddPerson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Share Method Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setShareMethod('link')}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                shareMethod === 'link'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              Copy Link
            </button>
            <button
              onClick={() => setShareMethod('email')}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                shareMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email Link
            </button>
          </div>

          {/* Copy Link Button */}
          {shareMethod === 'link' && (
            <button
              onClick={handleCopyLink}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                linkCopied
                  ? 'bg-green-50 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {linkCopied ? '✓ Link Copied!' : 'Copy Dashboard Link'}
            </button>
          )}

          {/* Shared With List */}
          {sharedUsers.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                People with access
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sharedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {user.name || user.email}
                      </p>
                      {user.name && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                      {user.permission === 'edit' ? 'Can edit' : 'Can view'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};