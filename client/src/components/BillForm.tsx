import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Hash, User, Calendar, Leaf, Flame, Scale, Droplet, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDropdown from './CustomDropdown';

interface BillFormData {
    billNumber: string;
    ownerName: string;
    date: string;
    sugarcaneType: number;
    weight: string;
    fuelCost: string;
    quotaNumber?: string;
}

const BillForm: React.FC<{ onBillRecorded: () => void }> = ({ onBillRecorded }) => {
    const [formData, setFormData] = useState<BillFormData>({
        billNumber: '',
        ownerName: '',
        date: new Date().toISOString().split('T')[0],
        sugarcaneType: 1,
        weight: '',
        fuelCost: '',
        quotaNumber: '',
    });

    const [quotas, setQuotas] = useState<string[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/settings');
                if (response.data.quotas) {
                    setQuotas(response.data.quotas);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast.error('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: number) => {
        setFormData(prev => ({ ...prev, sugarcaneType: type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.billNumber || !formData.ownerName || !formData.date || !formData.weight || !formData.quotaNumber) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            const payload = {
                ...formData,
                weight: Number(formData.weight),
                fuelCost: formData.fuelCost ? Number(formData.fuelCost) : undefined,
                sugarcaneType: Number(formData.sugarcaneType),
            };

            await axios.post('http://localhost:5001/api/bills', payload);
            toast.success('บันทึกข้อมูลสำเร็จ!');
            onBillRecorded();

            setFormData({
                billNumber: '',
                ownerName: '',
                date: new Date().toISOString().split('T')[0],
                sugarcaneType: 1,
                weight: '',
                fuelCost: '',
                quotaNumber: '',
            });
        } catch (error: any) {
            console.error('Error submitting bill:', error);
            const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Save size={20} className="text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-700">บันทึกบิลใหม่</h2>
            </div>

            <div className="p-6">


                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Bill Number & Quota */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. เลขที่บิล <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="billNumber"
                                    value={formData.billNumber}
                                    onChange={handleChange}
                                    placeholder="เช่น B-001"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลขโควตา <span className="text-red-500">*</span></label>
                            <CustomDropdown
                                options={quotas}
                                value={formData.quotaNumber || ''}
                                onChange={(value) => setFormData(prev => ({ ...prev, quotaNumber: value }))}
                                placeholder="-- เลือกเลขโควตา --"
                            />
                        </div>
                    </div>

                    {/* Owner Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">2. ชื่อเจ้าของบิล <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="ownerName"
                                value={formData.ownerName}
                                onChange={handleChange}
                                placeholder="ชื่อ-นามสกุล"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. วันที่บิล <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Sugarcane Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">4. ประเภทอ้อย <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleTypeChange(1)}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${formData.sugarcaneType === 1
                                    ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Leaf size={20} />
                                <span className="font-medium">อ้อยสด</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange(2)}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${formData.sugarcaneType === 2
                                    ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Flame size={20} />
                                <span className="font-medium">อ้อยไฟไหม้</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTypeChange(3)}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${formData.sugarcaneType === 3
                                    ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Leaf size={20} />
                                <span className="font-medium">อ้อยยอดยาว</span>
                            </button>
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">5. น้ำหนักอ้อย (ตัน) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Scale size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Fuel Cost */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">6. เติมน้ำมัน (บาท)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Droplet size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="number"
                                name="fuelCost"
                                value={formData.fuelCost}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#107c55] hover:bg-[#0d6b49] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            บันทึกข้อมูล
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillForm;
