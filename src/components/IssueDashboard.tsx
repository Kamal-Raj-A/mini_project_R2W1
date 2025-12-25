import { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Calendar, User, AlertCircle, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { IssueWithCategory, IssueCategory } from '../lib/database.types';

export default function IssueDashboard() {
  const [issues, setIssues] = useState<IssueWithCategory[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<IssueWithCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, statusFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);

    const [issuesResponse, categoriesResponse] = await Promise.all([
      supabase
        .from('issues')
        .select(`
          *,
          category:issue_categories(*)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('issue_categories')
        .select('*')
        .order('name')
    ]);

    if (issuesResponse.data) {
      setIssues(issuesResponse.data as any);
    }

    if (categoriesResponse.data) {
      setCategories(categoriesResponse.data);
    }

    setLoading(false);
  };

  const filterIssues = () => {
    let filtered = [...issues];

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category_id === categoryFilter);
    }

    setFilteredIssues(filtered);
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      'pending': 'bg-red-100 text-red-800 border-red-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
      'closed': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return classes[status as keyof typeof classes] || classes.pending;
  };

  const getPriorityBadgeClass = (priority: string) => {
    const classes = {
      'low': 'bg-blue-50 text-blue-700',
      'medium': 'bg-yellow-50 text-yellow-700',
      'high': 'bg-orange-50 text-orange-700',
      'critical': 'bg-red-50 text-red-700',
    };
    return classes[priority as keyof typeof classes] || classes.medium;
  };

  const handleEditIssue = (issue: IssueWithCategory) => {
    setEditingIssueId(issue.id);
    setEditingTitle(issue.title);
  };

  const handleSaveChanges = async () => {
    if (!editingIssueId || !editingTitle.trim()) return;

    setUpdatingId(editingIssueId);
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          title: editingTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingIssueId);

      if (error) throw error;

      setEditingIssueId(null);
      fetchData();
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIssueId(null);
    setEditingTitle('');
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Issues</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <AlertCircle className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔴</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-800">{stats.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🟡</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Resolved</p>
              <p className="text-3xl font-bold text-gray-800">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading issues...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No issues found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`border rounded-lg p-4 transition-all ${
                  editingIssueId === issue.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                {editingIssueId === issue.id ? (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Issue Title</label>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 flex-1">{issue.title}</h3>
                    <button
                      onClick={() => handleEditIssue(issue)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-2 py-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>

                {editingIssueId !== issue.id && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(issue.status)}`}>
                      {issue.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {issue.category && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${issue.category.color}20`,
                          color: issue.category.color
                        }}
                      >
                        {issue.category.name}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClass(issue.priority)}`}>
                      {issue.priority.toUpperCase()}
                    </span>
                  </div>
                )}

                {issue.image_url && (
                  <img
                    src={issue.image_url}
                    alt="Issue"
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}

                {editingIssueId !== issue.id && (
                  <div className="space-y-2 text-sm text-gray-600">
                    {issue.location_name && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span>{issue.location_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-green-600" />
                      <span>{new Date(issue.created_at).toLocaleDateString()} at {new Date(issue.created_at).toLocaleTimeString()}</span>
                    </div>

                    {issue.reporter_name && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-600" />
                        <span>Reported by: {issue.reporter_name}</span>
                      </div>
                    )}
                  </div>
                )}

                {editingIssueId === issue.id && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-blue-200">
                    <button
                      onClick={handleSaveChanges}
                      disabled={updatingId === issue.id}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {updatingId === issue.id ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updatingId === issue.id}
                      className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
