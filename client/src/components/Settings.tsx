import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Settings as SettingsIcon, List, Plus, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';

interface PriceConfig {
    _id?: string;
    effectiveDate: string;
    freshPrice: number;
    burntPrice: number;
    longTopPrice: number;
}

interface SettingData {
    quotas: string[];
}

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<SettingData>({
        quotas: [],
    });
    const [priceHistory, setPriceHistory] = useState<PriceConfig[]>([]);
    const [newPrice, setNewPrice] = useState<PriceConfig>({
        effectiveDate: new Date().toISOString().split('T')[0],
        freshPrice: 0,
        burntPrice: 0,
        longTopPrice: 0,
    });

    const [newQuota, setNewQuota] = useState('');

    const fetchData = async () => {
        try {
            const [settingsRes, pricesRes] = await Promise.all([
                axios.get('http://localhost:5001/api/settings'),
                axios.get('http://localhost:5001/api/prices')
            ]);

            setSettings({
                quotas: settingsRes.data.quotas || []
            });
            setPriceHistory(pricesRes.data);

            // Set default values for new price form based on latest price
            if (pricesRes.data.length > 0) {
                const latest = pricesRes.data[0];
                setNewPrice(prev => ({
                    ...prev,
                    freshPrice: latest.freshPrice,
                    burntPrice: latest.burntPrice,
                    longTopPrice: latest.longTopPrice
                }));
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPrice(prev => ({ ...prev, [name]: name === 'effectiveDate' ? value : Number(value) }));
    };

    const handleSavePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/prices', newPrice);
            toast.success('บันทึกราคาเรียบร้อยแล้ว');
            fetchData();
        } catch (error) {
            console.error('Error saving price:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกราคา');
        }
    };

    const handleDeletePrice = async (id: string) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบราคานี้?')) return;
        try {
            await axios.delete(`http://localhost:5001/api/prices/${id}`);
            toast.success('ลบราคาเรียบร้อยแล้ว');
            fetchData();
        } catch (error) {
            console.error('Error deleting price:', error);
            toast.error('เกิดข้อผิดพลาดในการลบราคา');
        }
    };

    const handleAddQuota = () => {
        if (newQuota.trim()) {
            const updatedQuotas = [...settings.quotas, newQuota.trim()];
            updateQuotas(updatedQuotas);
            setNewQuota('');
        }
    };

    const handleRemoveQuota = (quotaToRemove: string) => {
        const updatedQuotas = settings.quotas.filter(q => q !== quotaToRemove);
        updateQuotas(updatedQuotas);
    };

    const updateQuotas = async (quotas: string[]) => {
        try {
            await axios.put('http://localhost:5001/api/settings', { quotas });
            setSettings(prev => ({ ...prev, quotas }));
            toast.success('อัปเดตโควตาเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Error updating quotas:', error);
            toast.error('เกิดข้อผิดพลาดในการอัปเดตโควตา');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <SettingsIcon size={20} className="text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-700">ตั้งค่าระบบ</h2>
            </div>

            <div className="p-6 space-y-8">

                {/* Price Management Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-green-800 border-b pb-2">
                        <History size={24} />
                        <h3 className="font-semibold text-lg">จัดการราคาอ้อย (ตามวันที่)</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* New Price Form */}
                        <div className="lg:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Plus size={18} /> เพิ่ม/แก้ไข ราคาใหม่
                            </h4>
                            <form onSubmit={handleSavePrice} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">วันที่มีผล (Effective Date)</label>
                                    <input
                                        type="date"
                                        name="effectiveDate"
                                        value={newPrice.effectiveDate}
                                        onChange={handlePriceChange}
                                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-green-700 mb-1">ราคาอ้อยสด</label>
                                        <input
                                            type="number"
                                            name="freshPrice"
                                            value={newPrice.freshPrice}
                                            onChange={handlePriceChange}
                                            className="block w-full px-3 py-2 text-sm border border-green-200 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-orange-700 mb-1">ราคาอ้อยไฟไหม้</label>
                                        <input
                                            type="number"
                                            name="burntPrice"
                                            value={newPrice.burntPrice}
                                            onChange={handlePriceChange}
                                            className="block w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-yellow-700 mb-1">ราคาอ้อยยอดยาว</label>
                                        <input
                                            type="number"
                                            name="longTopPrice"
                                            value={newPrice.longTopPrice}
                                            onChange={handlePriceChange}
                                            className="block w-full px-3 py-2 text-sm border border-yellow-200 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    <Save size={16} /> บันทึกราคา
                                </button>
                            </form>
                        </div>

                        {/* Price History Table */}
                        <div className="lg:col-span-2 overflow-x-auto">
                            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <List size={18} /> ประวัติราคา
                            </h4>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่มีผล</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">อ้อยสด</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">ไฟไหม้</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-yellow-600 uppercase tracking-wider">ยอดยาว</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {priceHistory.map((price) => (
                                            <tr key={price._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(price.effectiveDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-700">{price.freshPrice.toLocaleString()}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-orange-700">{price.burntPrice.toLocaleString()}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-yellow-700">{price.longTopPrice.toLocaleString()}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeletePrice(price._id!)}
                                                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {priceHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                                    ไม่มีประวัติราคา
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quota Management Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-blue-800 border-b pb-2">
                        <List size={24} />
                        <h3 className="font-semibold text-lg">จัดการเลขโควตา</h3>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newQuota}
                                onChange={(e) => setNewQuota(e.target.value)}
                                placeholder="เพิ่มเลขโควตาใหม่ (เช่น Q-001)"
                                className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddQuota}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                                <Plus size={18} /> เพิ่ม
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {settings.quotas && settings.quotas.length > 0 ? (
                                settings.quotas.map((quota, index) => (
                                    <div key={index} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-200 text-sm">
                                        <span className="text-blue-900 font-medium">{quota}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuota(quota)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-blue-400 text-center py-2 w-full">ยังไม่มีเลขโควตา</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
