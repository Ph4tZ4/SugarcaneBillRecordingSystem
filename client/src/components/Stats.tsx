import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Leaf, Flame, Droplet, Scale, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Bill {
    _id: string;
    weight: number;
    fuelCost?: number;
    sugarcaneType: number;
    date: string;
    ownerName: string;
    netAmount: number;
}

interface StatsData {
    totalWeight: number;
    totalFuelCost: number;
    freshCount: number;
    burntCount: number;
    longTopCount: number;
    dailyData: any[];
    typeData: any[];
    paymentSummary: any[];
}

const COLORS = ['#16a34a', '#ea580c', '#ca8a04'];

const Stats: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
    const [stats, setStats] = useState<StatsData>({
        totalWeight: 0,
        totalFuelCost: 0,
        freshCount: 0,
        burntCount: 0,
        longTopCount: 0,
        dailyData: [],
        typeData: [],
        paymentSummary: []
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

                // Process Daily Data (Last 7 Days)
                const dailyMap = new Map();
                bills.forEach(bill => {
                    const date = new Date(bill.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
                    dailyMap.set(date, (dailyMap.get(date) || 0) + bill.weight);
                });
                const dailyData = Array.from(dailyMap, ([name, weight]) => ({ name, weight })).slice(0, 7).reverse();

                // Process Type Data
                const typeData = [
                    { name: 'อ้อยสด', value: freshCount },
                    { name: 'อ้อยไฟไหม้', value: burntCount },
                    { name: 'อ้อยยอดยาว', value: longTopCount },
                ].filter(item => item.value > 0);

                // Process Payment Summary
                const paymentMap = new Map();
                bills.forEach(bill => {
                    const owner = bill.ownerName;
                    if (!paymentMap.has(owner)) {
                        paymentMap.set(owner, {
                            ownerName: owner,
                            totalWeight: 0,
                            totalAmount: 0,
                            billCount: 0
                        });
                    }
                    const current = paymentMap.get(owner);
                    current.totalWeight += bill.weight;
                    current.totalAmount += bill.netAmount;
                    current.billCount += 1;
                });
                const paymentSummary = Array.from(paymentMap.values()).sort((a: any, b: any) => b.totalAmount - a.totalAmount);

                setStats({
                    totalWeight,
                    totalFuelCost,
                    freshCount,
                    burntCount,
                    longTopCount,
                    dailyData,
                    typeData,
                    paymentSummary
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, [refreshTrigger]);

    return (
        <div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Daily Weight Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="text-gray-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-700">ปริมาณอ้อยรายวัน (7 วันล่าสุด)</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ตัน`, 'น้ำหนัก']} />
                                <Bar dataKey="weight" fill="#107c55" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Type Distribution Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChartIcon className="text-gray-500" size={20} />
                        <h3 className="text-lg font-semibold text-gray-700">สัดส่วนประเภทอ้อย</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.typeData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => {
                                    const total = stats.typeData.reduce((sum, item) => sum + item.value, 0);
                                    const percent = ((value / total) * 100).toFixed(1);
                                    return [`${value} บิล (${percent}%)`, 'จำนวน'];
                                }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Payment Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-700">สรุปยอดจ่ายเงินชาวไร่</h3>
                    <button
                        onClick={() => window.print()}
                        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                        พิมพ์รายงาน
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">ชื่อชาวไร่</th>
                                <th className="px-6 py-4 font-medium text-center">จำนวนบิล</th>
                                <th className="px-6 py-4 font-medium text-right">น้ำหนักรวม (ตัน)</th>
                                <th className="px-6 py-4 font-medium text-right">ยอดเงินสุทธิ (บาท)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.paymentSummary.length > 0 ? (
                                stats.paymentSummary.map((item: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.ownerName}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{item.billCount}</td>
                                        <td className="px-6 py-4 text-right text-gray-600">{item.totalWeight.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">{item.totalAmount.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        ไม่มีข้อมูล
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Stats;
