import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, Search, Calendar, Filter, X, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ActivityLog {
    _id: string;
    username: string;
    role: string;
    action: string;
    details?: string;
    timestamp: string;
}

const ActivityLogs: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchLogs = async () => {
        try {
            const response = await axios.get('/api/activity-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('ไม่สามารถดึงข้อมูลบันทึกกิจกรรมได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, roleFilter]);

    // Back Up Logic
    const handleBackup = async () => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // 1. Export JSON
            const jsonContent = JSON.stringify(logs, null, 2);
            const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
            saveAs(jsonBlob, `activity_logs_backup_${timestamp}.json`);

            // 2. Export XLSX
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Activity Logs');

            worksheet.columns = [
                { header: 'Time', key: 'timestamp', width: 25 },
                { header: 'Username', key: 'username', width: 20 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Action', key: 'action', width: 25 },
                { header: 'Details', key: 'details', width: 50 },
            ];

            logs.forEach(log => {
                worksheet.addRow({
                    timestamp: new Date(log.timestamp).toLocaleString('th-TH'),
                    username: log.username,
                    role: log.role,
                    action: log.action,
                    details: log.details || '-'
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const excelBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(excelBlob, `activity_logs_backup_${timestamp}.xlsx`);

            toast.success('ดาวน์โหลดไฟล์ Backup สำเร็จ (JSON และ Excel)');

        } catch (error) {
            console.error('Backup error:', error);
            toast.error('เกิดข้อผิดพลาดในการ Backup ข้อมูล');
        }
    };

    // Clear Old Logs Logic
    const handleClearLogs = async () => {
        if (!window.confirm('คุณต้องการลบบันทึกกิจกรรมที่เก่ากว่า 3 วันหรือไม่? \n\nการกระทำนี้ไม่สามารถย้อนกลับได้!')) {
            return;
        }

        try {
            const response = await axios.delete('/api/activity-logs/prune');
            toast.success(`ลบรายการเก่าเรียบร้อย (${response.data.deletedCount} รายการ)`);
            fetchLogs(); // Refresh list
        } catch (error: any) {
            console.error('Error pruning logs:', error);
            toast.error('ไม่สามารถลบรายการได้');
        }
    };

    // Filter Logic
    const filteredLogs = logs.filter(log => {
        // 1. Search Term (Username, Action, Details)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            log.username.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            (log.details && log.details.toLowerCase().includes(searchLower));

        // 2. Date Range
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && new Date(log.timestamp) >= new Date(startDate);
        }
        if (endDate) {
            // Set end date to end of day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && new Date(log.timestamp) <= end;
        }

        // 3. Role Filter
        const matchesRole = roleFilter === 'all' || log.role === roleFilter;

        return matchesSearch && matchesDate && matchesRole;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setRoleFilter('all');
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const PaginationControls = () => (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg text-sm px-2 py-1 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">รายการต่อหน้า</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">
                    หน้า {currentPage} จาก {totalPages || 1}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    ก่อนหน้า
                </button>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors ${currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    ถัดไป
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <History className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">บันทึกกิจกรรม</h1>
                        <p className="text-gray-500">ประวัติการใช้งานระบบของผู้ดูแล</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleBackup}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        title="ดาวน์โหลด JSON และ Excel"
                    >
                        <Download size={20} />
                        <span>Backup Log (JSON + XLSX)</span>
                    </button>
                    {currentUser?.role === 'root' && (
                        <button
                            onClick={handleClearLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-sm border border-red-200"
                            title="ลบข้อมูลที่เก่ากว่า 3 วัน"
                        >
                            <Trash2 size={20} />
                            <span>เคลียร์ประวัติเก่า (3 วัน+)</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filter Section */}
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหาผู้ใช้, กิจกรรม..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter size={18} className="text-gray-400" />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                            >
                                <option value="all">ทุกบทบาท</option>
                                <option value="root">Root</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="เริ่มต้น"
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Clear Button */}
                        <button
                            onClick={clearFilters}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${searchTerm || startDate || endDate || roleFilter !== 'all'
                                ? 'text-white bg-red-500 hover:bg-red-600 shadow-sm'
                                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            <X size={18} />
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>

                {/* Top Pagination */}
                <PaginationControls />

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">เวลา</th>
                                <th className="px-6 py-4 font-medium">ผู้ใช้งาน</th>
                                <th className="px-6 py-4 font-medium">บทบาท</th>
                                <th className="px-6 py-4 font-medium">กิจกรรม</th>
                                <th className="px-6 py-4 font-medium">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString('th-TH')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{log.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.role === 'root' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{log.details || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        ไม่พบข้อมูลกิจกรรม
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Pagination */}
                <PaginationControls />
            </div>
        </div>
    );
};

export default ActivityLogs;
