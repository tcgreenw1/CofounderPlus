import React, { useState } from 'react';
import { User, Mail, Plus, Trash2, Edit2, X, Shield, Users, Headphones, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'support';
  phone?: string;
  avatar?: string;
}

interface TeamManagementProps {
  onUpdate?: () => void;
}

export function TeamManagement({ onUpdate }: TeamManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales',
    phone: '',
  });

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/employees`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingEmployee;
      const url = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/employees/${editingEmployee.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/employees`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Team member updated' : 'Team member added');
        setShowAddModal(false);
        setEditingEmployee(null);
        setFormData({ name: '', email: '', role: 'sales', phone: '' });
        fetchEmployees();
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/employees/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Team member removed');
        fetchEmployees();
        if (onUpdate) onUpdate();
      } else {
        toast.error('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to remove team member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="size-4" />;
      case 'sales': return <Users className="size-4" />;
      case 'support': return <Headphones className="size-4" />;
      default: return <User className="size-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'sales': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'support': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-[var(--spacing-6)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Team Management</h2>
        <button
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ name: '', email: '', role: 'sales', phone: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-[var(--spacing-8)]">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-[var(--spacing-12)] bg-muted rounded-[var(--radius-xl)]">
          <Users className="size-12 mx-auto text-muted-foreground mb-[var(--spacing-4)]" />
          <p className="text-muted-foreground">No team members yet. Add someone to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-4)]">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="p-[var(--spacing-4)] bg-card border border-border rounded-[var(--radius-xl)] flex flex-col gap-[var(--spacing-3)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-[var(--spacing-3)]">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{employee.name}</h3>
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border w-fit mt-1 ${getRoleColor(employee.role)}`}>
                      {getRoleIcon(employee.role)}
                      <span className="capitalize">{employee.role}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setFormData({
                        name: employee.name,
                        email: employee.email,
                        role: employee.role,
                        phone: employee.phone || '',
                      });
                      setShowAddModal(true);
                    }}
                    className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="size-3" />
                  {employee.email}
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3" />
                    {employee.phone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div 
            className="w-full max-w-md bg-background p-[var(--spacing-6)] rounded-[var(--radius-xl)] border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-[var(--spacing-6)]">
              <h3 className="text-xl font-bold text-foreground">
                {editingEmployee ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-md">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[var(--spacing-4)]">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  // @ts-ignore
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                >
                  <option value="sales">Salesperson</option>
                  <option value="support">Technical Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
