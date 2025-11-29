import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BillList from './BillList';
import { FileText, AlertCircle } from 'lucide-react';

const SharedBillView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const validateToken = async () => {
            try {
                await axios.get(`http://localhost:5001/api/share/${token}`);
                setIsValid(true);
            } catch (err) {
                setIsValid(false);
                setError('ลิงก์นี้หมดอายุหรือไม่มีอยู่ในระบบ');
            }
        };
        validateToken();
    }, [token]);

    if (isValid === null) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังตรวจสอบลิงก์...</div>;
    }

    if (!isValid) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่สามารถเข้าถึงข้อมูลได้</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {/* Simplified Header for Shared View */}
            <header className="bg-[#107c55] text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText size={24} />
                        <h1 className="text-xl font-bold">ระบบบันทึกบิลอ้อย (Shared View)</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BillList isSharedView={true} />
            </main>
        </div>
    );
};

export default SharedBillView;
