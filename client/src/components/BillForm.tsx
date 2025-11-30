import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Hash, User, Calendar, Leaf, Flame, Scale, Droplet, Save, Truck } from 'lucide-react';
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
    price: string;
    licensePlate: string;
}

interface Farmer {
    _id: string;
    name: string;
    quotaId?: string;
    licensePlates?: string[];
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
        price: '',
        licensePlate: '',
    });

    const [isManualPrice, setIsManualPrice] = useState(false);

    const [quotas, setQuotas] = useState<string[]>([]);
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [showFarmerSuggestions, setShowFarmerSuggestions] = useState(false);
    const [farmerLicensePlates, setFarmerLicensePlates] = useState<string[]>([]);
    const [showLicenseSuggestions, setShowLicenseSuggestions] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, farmersRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/settings'),
                    axios.get('http://localhost:5001/api/farmers')
                ]);

                if (settingsRes.data.quotas) {
                    setQuotas(settingsRes.data.quotas);
                }
                setFarmers(farmersRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('ไม่สามารถโหลดข้อมูลได้');
            }
        };
        fetchData();
    }, []);

    // Check for duplicate bill number
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!formData.billNumber) {
                setIsDuplicate(false);
                return;
            }

            setIsChecking(true);
            try {
                const response = await axios.get(`http://localhost:5001/api/bills/check-duplicate/${formData.billNumber}`);
                setIsDuplicate(response.data.exists);
            } catch (error) {
                console.error('Error checking duplicate:', error);
            } finally {
                setIsChecking(false);
            }
        };

        const timeoutId = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.billNumber]);

    // Fetch price when date or type changes (if not manual)
    useEffect(() => {
        if (isManualPrice) return;

        const fetchPrice = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/price-check?date=${formData.date}`);
                const config = response.data;

                let price = 0;
                if (formData.sugarcaneType === 1) price = config.freshPrice;
                else if (formData.sugarcaneType === 2) price = config.burntPrice;
                else if (formData.sugarcaneType === 3) price = config.longTopPrice;

                setFormData(prev => ({ ...prev, price: price.toString() }));
            } catch (error) {
                console.error('Error fetching price:', error);
            }
        };

        fetchPrice();
    }, [formData.date, formData.sugarcaneType, isManualPrice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: number) => {
        setFormData(prev => ({ ...prev, sugarcaneType: type }));
    };

    const handleFarmerSelect = (farmer: Farmer) => {
        setFormData(prev => ({
            ...prev,
            ownerName: farmer.name,
            quotaNumber: farmer.quotaId || prev.quotaNumber
        }));
        setFarmerLicensePlates(farmer.licensePlates || []);
        setShowFarmerSuggestions(false);
    };

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(formData.ownerName.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.billNumber || !formData.ownerName || !formData.date || !formData.weight || !formData.quotaNumber) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (isDuplicate) {
            toast.error('เลขที่บิลซ้ำ กรุณาเปลี่ยนเลขที่บิล');
            return;
        }

        try {
            const payload = {
                ...formData,
                weight: Number(formData.weight),
                fuelCost: formData.fuelCost ? Number(formData.fuelCost) : undefined,
                sugarcaneType: Number(formData.sugarcaneType),
                manualPrice: isManualPrice ? Number(formData.price) : undefined,
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
                price: '',
                licensePlate: '',
            });
            setFarmerLicensePlates([]);
            setIsManualPrice(false);
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บิล <span className="text-red-500">*</span></label>
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
                                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg sm:text-sm transition-colors ${isDuplicate
                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                        : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                        }`}
                                    required
                                />
                                {isChecking && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-xs text-gray-400">กำลังตรวจสอบ...</span>
                                    </div>
                                )}
                            </div>
                            {isDuplicate && (
                                <p className="mt-1 text-xs text-red-500">
                                    * เลขที่บิลนี้มีอยู่ในระบบแล้ว
                                </p>
                            )}
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
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเจ้าของบิล <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="ownerName"
                                value={formData.ownerName}
                                onChange={(e) => {
                                    handleChange(e);
                                    setShowFarmerSuggestions(true);
                                }}
                                onFocus={() => setShowFarmerSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowFarmerSuggestions(false), 200)}
                                placeholder="ชื่อ-นามสกุล"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                required
                                autoComplete="off"
                            />
                        </div>
                        {showFarmerSuggestions && formData.ownerName && filteredFarmers.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {filteredFarmers.map((farmer) => (
                                    <button
                                        key={farmer._id}
                                        type="button"
                                        onClick={() => handleFarmerSelect(farmer)}
                                        className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm text-gray-700 flex justify-between items-center"
                                    >
                                        <span>{farmer.name}</span>
                                        {farmer.quotaId && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{farmer.quotaId}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* License Plate */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนรถ</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Truck size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="licensePlate"
                                value={formData.licensePlate}
                                onChange={(e) => {
                                    handleChange(e);
                                    setShowLicenseSuggestions(true);
                                }}
                                onFocus={() => setShowLicenseSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowLicenseSuggestions(false), 200)}
                                placeholder="เช่น 80-1234"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                autoComplete="off"
                            />
                        </div>
                        {showLicenseSuggestions && formData.licensePlate === '' && farmerLicensePlates.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-40 overflow-auto">
                                {farmerLicensePlates.map((plate, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, licensePlate: plate }));
                                            setShowLicenseSuggestions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm text-gray-700"
                                    >
                                        {plate}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่บิล <span className="text-red-500">*</span></label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอ้อย <span className="text-red-500">*</span></label>
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

                    {/* Price Adjustment */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">ราคาต่อตัน (บาท)</label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="manualPrice"
                                    checked={isManualPrice}
                                    onChange={(e) => setIsManualPrice(e.target.checked)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="manualPrice" className="ml-2 block text-sm text-gray-900">
                                    ปรับราคาเอง
                                </label>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-bold">฿</span>
                            </div>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                disabled={!isManualPrice}
                                className={`block w-full pl-8 pr-3 py-2.5 border rounded-lg sm:text-sm transition-colors ${isManualPrice
                                    ? 'border-gray-300 bg-white focus:ring-green-500 focus:border-green-500'
                                    : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                    }`}
                            />
                        </div>
                        {!isManualPrice && (
                            <p className="mt-1 text-xs text-gray-500">
                                * อิงราคาตามวันที่และประเภทอ้อยที่เลือก
                            </p>
                        )}
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักอ้อย (ตัน) <span className="text-red-500">*</span></label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">เติมน้ำมัน (บาท)</label>
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
