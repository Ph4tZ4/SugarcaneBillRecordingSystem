import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Leaf, Flame, Search, Calendar, Filter, X, Download, FileJson, FileSpreadsheet, FileText, Share2, Copy, Check } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface Bill {
    _id: string;
    billNumber: string;
    ownerName: string;
    date: string;
    sugarcaneType: number;
    weight: number;
    fuelCost?: number;
    pricePerUnit: number;
    totalAmount: number;
    netAmount: number;
    quotaNumber?: string;
}

interface BillListProps {
    isSharedView?: boolean;
}

const BillList: React.FC<BillListProps> = ({ isSharedView = false }) => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterType, setFilterType] = useState<number | 'all'>('all');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // Share State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareDuration, setShareDuration] = useState('1');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await axios.get<Bill[]>('http://localhost:5001/api/bills');
                setBills(response.data);
            } catch (error) {
                console.error('Error fetching bills:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, []);

    // Filter Logic
    const filteredBills = bills.filter(bill => {
        // 1. Search Term (Bill Number, Owner Name, Quota Number)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            bill.billNumber.toLowerCase().includes(searchLower) ||
            bill.ownerName.toLowerCase().includes(searchLower) ||
            (bill.quotaNumber && bill.quotaNumber.toLowerCase().includes(searchLower));

        // 2. Date Range
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && new Date(bill.date) >= new Date(startDate);
        }
        if (endDate) {
            matchesDate = matchesDate && new Date(bill.date) <= new Date(endDate);
        }

        // 3. Sugarcane Type
        const matchesType = filterType === 'all' || bill.sugarcaneType === filterType;

        return matchesSearch && matchesDate && matchesType;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setFilterType('all');
    };

    // Export Handlers
    const handleExportJSON = () => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(filteredBills, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `bills_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success('ดาวน์โหลด JSON สำเร็จ');
    };

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bills');

        // Define columns
        worksheet.columns = [
            { header: 'วันที่', key: 'date', width: 15 },
            { header: 'เลขที่บิล', key: 'billNumber', width: 15 },
            { header: 'โควตา', key: 'quotaNumber', width: 15 },
            { header: 'ชื่อเจ้าของ', key: 'ownerName', width: 25 },
            { header: 'ประเภท', key: 'sugarcaneType', width: 15 },
            { header: 'น้ำหนัก (ตัน)', key: 'weight', width: 15 },
            { header: 'ราคา/ตัน', key: 'pricePerUnit', width: 15 },
            { header: 'รวมเงิน', key: 'totalAmount', width: 15 },
            { header: 'หักน้ำมัน', key: 'fuelCost', width: 15 },
            { header: 'สุทธิ', key: 'netAmount', width: 15 },
        ];

        // Add rows
        filteredBills.forEach(bill => {
            const row = worksheet.addRow({
                date: new Date(bill.date).toLocaleDateString('th-TH'),
                billNumber: bill.billNumber,
                quotaNumber: bill.quotaNumber || '-',
                ownerName: bill.ownerName,
                sugarcaneType: bill.sugarcaneType === 1 ? 'อ้อยสด' : bill.sugarcaneType === 2 ? 'อ้อยไฟไหม้' : 'อ้อยยอดยาว',
                weight: bill.weight,
                pricePerUnit: bill.pricePerUnit,
                totalAmount: bill.totalAmount,
                fuelCost: bill.fuelCost || 0,
                netAmount: bill.netAmount
            });

            // Apply conditional styling
            // Sugarcane Type is in column 5 (E)
            const typeCell = row.getCell(5);
            let fillColor = '';

            if (bill.sugarcaneType === 1) {
                fillColor = 'FFC6EFCE'; // Green
            } else if (bill.sugarcaneType === 2) {
                fillColor = 'FFFFEB9C'; // Orange
            } else if (bill.sugarcaneType === 3) {
                fillColor = 'FFFFFF00'; // Yellow
            }

            if (fillColor) {
                typeCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: fillColor }
                };
            }
        });

        // Apply font to all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.font = { name: 'TH SarabunPSK', size: 16 };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Header styling
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { name: 'TH SarabunPSK', size: 16, bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `bills_${new Date().toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        toast.success('ดาวน์โหลด Excel สำเร็จ');
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add font support for Thai would require adding a font file here
        // For now, we will use standard font and warn user if needed, or rely on English headers where possible
        // But since requirements are Thai, we try our best.
        // Note: Standard jsPDF does not support Thai glyphs without a custom font.
        // We will use a workaround or just render what we can.

        autoTable(doc, {
            head: [['Date', 'Bill No', 'Quota', 'Owner', 'Type', 'Weight', 'Price', 'Total', 'Fuel', 'Net']],
            body: filteredBills.map(bill => [
                new Date(bill.date).toLocaleDateString('en-GB'), // Use EN date to avoid Thai chars issue in PDF for now
                bill.billNumber,
                bill.quotaNumber || '-',
                bill.ownerName, // This might show garbage if Thai
                bill.sugarcaneType,
                bill.weight,
                bill.pricePerUnit,
                bill.totalAmount,
                bill.fuelCost || 0,
                bill.netAmount
            ]),
        });

        doc.save(`bills_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('ดาวน์โหลด PDF สำเร็จ (หมายเหตุ: ภาษาไทยอาจแสดงผลไม่ถูกต้อง)');
        doc.save(`bills_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('ดาวน์โหลด PDF สำเร็จ (หมายเหตุ: ภาษาไทยอาจแสดงผลไม่ถูกต้อง)');
    };

    // Share Handlers
    const handleGenerateLink = async () => {
        try {
            const response = await axios.post('http://localhost:5001/api/share', { duration: shareDuration });
            const { token } = response.data;
            const link = `${window.location.origin}/share/${token}`;
            setGeneratedLink(link);
            toast.success('สร้างลิงก์แชร์สำเร็จ');
        } catch (error) {
            console.error('Error generating link:', error);
            toast.error('ไม่สามารถสร้างลิงก์ได้');
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setIsCopied(true);
        toast.success('คัดลอกลิงก์แล้ว');
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, filterType]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    if (loading) {
        return <div className="text-center py-10">กำลังโหลดข้อมูล...</div>;
    }

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
                    <option value={40}>40</option>
                    <option value={60}>60</option>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-700">รายการบิลทั้งหมด</h2>
            </div>

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
                            placeholder="ค้นหาเลขที่บิล, ชื่อ, โควตา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter size={18} className="text-gray-400" />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                        >
                            <option value="all">ทุกประเภทอ้อย</option>
                            <option value="1">อ้อยสด</option>
                            <option value="2">อ้อยไฟไหม้</option>
                            <option value="3">อ้อยยอดยาว</option>
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
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                placeholder="เริ่มต้น"
                            />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    {/* Clear Button */}
                    {/* Clear Button */}
                    {/* Clear Button */}
                    <button
                        onClick={clearFilters}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${searchTerm || startDate || endDate || filterType !== 'all'
                            ? 'text-white bg-red-500 hover:bg-red-600 shadow-sm'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        <X size={18} />
                        ล้างตัวกรอง
                    </button>

                    {/* Action Buttons Group */}
                    <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className="flex items-center justify-center gap-2 px-4 py-2 w-32 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Download size={18} />
                                ดาวน์โหลด
                            </button>

                            {isExportMenuOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-20 border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={() => { handleExportJSON(); setIsExportMenuOpen(false); }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <FileJson size={18} className="text-orange-500" />
                                        <span>JSON</span>
                                    </button>
                                    <button
                                        onClick={() => { handleExportExcel(); setIsExportMenuOpen(false); }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
                                    >
                                        <FileSpreadsheet size={18} className="text-green-600" />
                                        <span>Excel</span>
                                    </button>
                                    <button
                                        onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-50"
                                    >
                                        <FileText size={18} className="text-red-500" />
                                        <span>PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Share Button (Hidden in Shared View) */}
                        {!isSharedView && (
                            <>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 w-32 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Share2 size={18} />
                                    แชร์
                                </button>

                                {/* Share Modal */}
                                {isShareModalOpen && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                    <Share2 size={20} className="text-blue-600" />
                                                    แชร์รายการบิล
                                                </h3>
                                                <button onClick={() => { setIsShareModalOpen(false); setGeneratedLink(''); }} className="text-gray-400 hover:text-gray-600">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                {!generatedLink ? (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">ระยะเวลาที่สามารถเข้าถึงได้</label>
                                                            <select
                                                                value={shareDuration}
                                                                onChange={(e) => setShareDuration(e.target.value)}
                                                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                            >
                                                                <option value="1">1 ชั่วโมง</option>
                                                                <option value="3">3 ชั่วโมง</option>
                                                                <option value="6">6 ชั่วโมง</option>
                                                                <option value="12">12 ชั่วโมง</option>
                                                                <option value="24">24 ชั่วโมง</option>
                                                                <option value="forever">ตลอดเวลา</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            onClick={handleGenerateLink}
                                                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                                        >
                                                            สร้างลิงก์
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center gap-2">
                                                            <Check size={16} /> สร้างลิงก์สำเร็จ!
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">ลิงก์สำหรับแชร์</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={generatedLink}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                                                                />
                                                                <button
                                                                    onClick={handleCopyLink}
                                                                    className={`px-3 py-2 rounded-lg border transition-colors ${isCopied
                                                                        ? 'bg-green-50 border-green-200 text-green-600'
                                                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            ผู้ที่มีลิงก์นี้จะสามารถดูรายการบิลได้เท่านั้น ไม่สามารถแก้ไขหรือลบข้อมูลได้
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Pagination */}
            <PaginationControls />

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">วันที่</th>
                            <th scope="col" className="px-6 py-3">เลขที่บิล</th>
                            <th scope="col" className="px-6 py-3">โควตา</th>
                            <th scope="col" className="px-6 py-3">ชื่อเจ้าของ</th>
                            <th scope="col" className="px-6 py-3">ประเภท</th>
                            <th scope="col" className="px-6 py-3 text-right">น้ำหนัก (ตัน)</th>
                            <th scope="col" className="px-6 py-3 text-right">ราคา/ตัน</th>
                            <th scope="col" className="px-6 py-3 text-right">รวมเงิน</th>
                            <th scope="col" className="px-6 py-3 text-right">หักน้ำมัน</th>
                            <th scope="col" className="px-6 py-3 text-right">สุทธิ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((bill) => (
                            <tr key={bill._id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {new Date(bill.date).toLocaleDateString('th-TH')}
                                </td>
                                <td className="px-6 py-4">{bill.billNumber}</td>
                                <td className="px-6 py-4">
                                    {bill.quotaNumber ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {bill.quotaNumber}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4">{bill.ownerName}</td>
                                <td className="px-6 py-4">
                                    {bill.sugarcaneType === 1 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Leaf size={12} /> อ้อยสด
                                        </span>
                                    ) : bill.sugarcaneType === 2 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            <Flame size={12} /> อ้อยไฟไหม้
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            <Leaf size={12} /> อ้อยยอดยาว
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">{bill.weight.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-gray-500">{bill.pricePerUnit?.toLocaleString() || '-'}</td>
                                <td className="px-6 py-4 text-right text-gray-500">{bill.totalAmount?.toLocaleString() || '-'}</td>
                                <td className="px-6 py-4 text-right text-red-500">
                                    {bill.fuelCost ? `-${bill.fuelCost.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-green-700">
                                    {bill.netAmount?.toLocaleString() || '-'}
                                </td>
                            </tr>
                        ))}
                        {filteredBills.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-6 py-10 text-center text-gray-400">
                                    ไม่พบข้อมูลที่ค้นหา
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Pagination */}
            <PaginationControls />
        </div>
    );
};

export default BillList;
