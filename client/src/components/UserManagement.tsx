import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, Trash2, Shield, Key, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface User {
    _id: string;
    username: string;
    role: 'admin' | 'root';
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [modalUsername, setModalUsername] = useState('');
    const [modalPassword, setModalPassword] = useState('');
    const [modalRole, setModalRole] = useState<'admin' | 'root'>('admin');

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openAddModal = () => {
        setIsEditing(false);
        setCurrentUserId(null);
        setModalUsername('');
        setModalPassword('');
        setModalRole('admin');
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setIsEditing(true);
        setCurrentUserId(user._id);
        setModalUsername(user.username);
        setModalPassword(''); // Blank for "Don't change"
        setModalRole(user.role);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentUserId) {
                // Edit (PUT)
                await axios.put(`/api/users/${currentUserId}`, {
                    username: modalUsername,
                    role: modalRole,
                    ...(modalPassword ? { password: modalPassword } : {})
                });
                toast.success('แก้ไขผู้ใช้งานสำเร็จ');
            } else {
                // Add (POST)
                await axios.post('/api/users', {
                    username: modalUsername,
                    password: modalPassword,
                    role: modalRole
                });
                toast.success('เพิ่มผู้ใช้งานสำเร็จ');
            }

            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast.error(error.response?.data?.message || 'การดำเนินการล้มเหลว');
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!window.confirm(`คุณต้องการลบผู้ใช้ ${username} ใช่หรือไม่?`)) return;

        try {
            await axios.delete(`/api/users/${userId}`);
            toast.success('ลบผู้ใช้งานสำเร็จ');
            fetchUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้');
        }
    };

    // Helper to check permissions
    const canManageUser = (targetUser: User) => {
        if (currentUser?.username === 'Phat') {
            // Super Root (Phat) can manage EVERYONE except themselves
            return targetUser.username !== 'Phat';
        } else {
            // Regular Root can manage only Admins
            return targetUser.role === 'admin';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Users className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
                        <p className="text-gray-500">เพิ่มหรือลบผู้ดูแลระบบ</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                    <span>เพิ่มผู้ใช้งาน</span>
                </button>
            </div>

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-down">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {isEditing ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                                    <div className="relative">
                                        <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={modalUsername}
                                            onChange={(e) => setModalUsername(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Username"
                                            disabled={modalUsername === 'Phat' && isEditing} // Lock Phat username
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isEditing ? 'รหัสผ่านใหม่ (ว่างไว้ถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}
                                    </label>
                                    <div className="relative">
                                        <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            required={!isEditing}
                                            value={modalPassword}
                                            onChange={(e) => setModalPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                            placeholder={isEditing ? 'เว้นว่างเพื่อใช้รหัสเดิม' : 'Password'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                                    <div className="relative">
                                        <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select
                                            value={modalRole}
                                            onChange={(e) => setModalRole(e.target.value as 'admin' | 'root')}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                                            disabled={modalUsername === 'Phat'} // Lock Phat role
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="root">Root</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        {isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มผู้ใช้งาน'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-medium">ชื่อผู้ใช้</th>
                            <th className="px-6 py-4 font-medium">บทบาท</th>
                            <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    กำลังโหลดข้อมูล...
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${user.role === 'root' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Users size={16} />
                                        </div>
                                        {user.username}
                                        {user.username === currentUser?.username && (
                                            <span className="text-xs text-gray-400">(คุณ)</span>
                                        )}
                                        {user.username === 'Phat' && (
                                            <span className="text-xs text-purple-600 font-bold px-2 py-0.5 bg-purple-50 rounded-full border border-purple-100">SUPER ROOT</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'root' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {canManageUser(user) && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id, user.username)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    ไม่พบข้อมูลผู้ใช้งาน
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
