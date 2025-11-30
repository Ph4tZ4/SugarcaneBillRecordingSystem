import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, User, Truck, X, Save } from 'lucide-react';

interface Farmer {
    _id: string;
    name: string;
    licensePlates: string[];
}

const FarmerList: React.FC = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
    const [formData, setFormData] = useState<{ name: string; licensePlates: string[] }>({
        name: '',
        licensePlates: []
    });
    const [newPlate, setNewPlate] = useState('');

    useEffect(() => {
        fetchFarmers();
    }, []);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/farmers');
            setFarmers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching farmers:', error);
            setLoading(false);
        }
    };

    const handleOpenModal = (farmer?: Farmer) => {
        if (farmer) {
            setEditingFarmer(farmer);
            setFormData({
                name: farmer.name,
                licensePlates: farmer.licensePlates || []
            });
        } else {
            setEditingFarmer(null);
            setFormData({
                name: '',
                licensePlates: []
            });
        }
        setNewPlate('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFarmer(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFarmer) {
                await axios.put(`http://localhost:5001/api/farmers/${editingFarmer._id}`, formData);
            } else {
                await axios.post('http://localhost:5001/api/farmers', formData);
            }
            fetchFarmers();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving farmer:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลชาวไร่นี้?')) {
            try {
                await axios.delete(`http://localhost:5001/api/farmers/${id}`);
                fetchFarmers();
            } catch (error) {
                console.error('Error deleting farmer:', error);
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    };

    const filteredFarmers = farmers.filter(farmer =>
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.licensePlates.some(plate => plate.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const addLicensePlate = () => {
        if (newPlate.trim()) {
            setFormData({
                ...formData,
                licensePlates: [...formData.licensePlates, newPlate.trim()]
            });
            setNewPlate('');
        }
    };

    const removeLicensePlate = (indexToRemove: number) => {
        setFormData({
            ...formData,
            licensePlates: formData.licensePlates.filter((_, index) => index !== indexToRemove)
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-green-600" />
                        จัดการข้อมูลชาวไร่
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">เพิ่ม ลบ แก้ไข ข้อมูลชาวไร่อ้อย</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    เพิ่มชาวไร่ใหม่
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ หรือ ทะเบียนรถ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">ชื่อ-นามสกุล</th>
                                <th className="px-6 py-4 font-medium">ทะเบียนรถ</th>
                                <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : filteredFarmers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        ไม่พบข้อมูลชาวไร่
                                    </td>
                                </tr>
                            ) : (
                                filteredFarmers.map((farmer) => (
                                    <tr key={farmer._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{farmer.name}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-wrap gap-1">
                                                {farmer.licensePlates && farmer.licensePlates.length > 0 ? (
                                                    farmer.licensePlates.map((plate, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                            {plate}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(farmer)}
                                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(farmer._id)}
                                                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingFarmer ? 'แก้ไขข้อมูลชาวไร่' : 'เพิ่มชาวไร่ใหม่'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                        placeholder="เช่น นายสมชาย ใจดี"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={newPlate}
                                                onChange={(e) => setNewPlate(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addLicensePlate();
                                                    }
                                                }}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                placeholder="เพิ่มทะเบียนรถ..."
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addLicensePlate}
                                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {formData.licensePlates.map((plate, index) => (
                                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-sm">
                                                {plate}
                                                <button
                                                    type="button"
                                                    onClick={() => removeLicensePlate(index)}
                                                    className="text-green-500 hover:text-green-700"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex justify-center items-center gap-2"
                                >
                                    <Save size={18} />
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerList;
