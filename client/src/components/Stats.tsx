import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Leaf, Flame, Droplet, Scale } from 'lucide-react';

interface Bill {
    _id: string;
    weight: number;
    fuelCost?: number;
    sugarcaneType: number;
}

interface StatsData {
    totalWeight: number;
    totalFuelCost: number;
    freshCount: number;
    burntCount: number;
    longTopCount: number;
}

const Stats: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [stats, setStats] = useState<StatsData>({
        totalWeight: 0,
        totalFuelCost: 0,
        freshCount: 0,
        burntCount: 0,
        longTopCount: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get<Bill[]>('http://localhost:5001/api/bills');
                const bills = response.data;

                const totalWeight = bills.reduce((sum, bill) => sum + bill.weight, 0);
                const totalFuelCost = bills.reduce((sum, bill) => sum + (bill.fuelCost || 0), 0);
                const freshCount = bills.filter(b => b.sugarcaneType === 1).length;
                const burntCount = bills.filter(b => b.sugarcaneType === 2).length;
                const longTopCount = bills.filter(b => b.sugarcaneType === 3).length;

                setStats({
                    totalWeight,
                    totalFuelCost,
                    freshCount,
                    burntCount,
                    longTopCount
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, [refreshTrigger]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Scale className="text-green-600" size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase">รวมทั้งหมด</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalWeight.toLocaleString()}</h3>
                <p className="text-sm text-gray-500 mt-1">น้ำหนักรวม (ตัน)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-50 rounded-lg">
                        <Droplet className="text-orange-600" size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase">รวมทั้งหมด</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalFuelCost.toLocaleString()}</h3>
                <p className="text-sm text-gray-500 mt-1">ค่าเติมน้ำมัน (บาท)</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Leaf className="text-green-700" size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase">จำนวนบิล</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.freshCount}</h3>
                <p className="text-sm text-gray-500 mt-1">อ้อยสด</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Flame className="text-orange-700" size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase">จำนวนบิล</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.burntCount}</h3>
                <p className="text-sm text-gray-500 mt-1">อ้อยไฟไหม้</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Leaf className="text-yellow-700" size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase">จำนวนบิล</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.longTopCount}</h3>
                <p className="text-sm text-gray-500 mt-1">อ้อยยอดยาว</p>
            </div>
        </div>
    );
};

export default Stats;
