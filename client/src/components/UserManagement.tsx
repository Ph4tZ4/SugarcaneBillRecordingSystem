import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, Trash2, Shield, Key } from 'lucide-react';
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

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'root'>('admin');

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/users');
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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/users', {
                username: newUsername,
                password: newPassword,
                role: newRole
            });
            toast.success('เพิ่มผู้ใช้งานสำเร็จ');
            setIsAdding(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('admin');
            fetchUsers();
        } catch (error: any) {
            console.error('Error adding user:', error);
            toast.error(error.response?.data?.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!window.confirm(`คุณต้องการลบผู้ใช้ ${username} ใช่หรือไม่?`)) return;

        try {
            await axios.delete(`http://localhost:5001/api/users/${userId}`);
            toast.success('ลบผู้ใช้งานสำเร็จ');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('ไม่สามารถลบผู้ใช้งานได้');
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
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                    <span>เพิ่มผู้ใช้งาน</span>
                </button>
            </div>

            {/* Add User Form */}
            {isAdding && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in-down">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">เพิ่มผู้ใช้งานใหม่</h3>
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                            <div className="relative">
                                <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Username"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                            <div className="relative">
                                <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                            <div className="relative">
                                <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'root')}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="root">Root</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                บันทึก
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
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
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'root' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.username !== 'root' && user.username !== currentUser?.username && (
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.username)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบผู้ใช้งาน"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
