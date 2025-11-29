import React from 'react';
import { FileText, List, PlusCircle, Settings as SettingsIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-50 bg-[#107c55] text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-full">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">ระบบบันทึกบิลอ้อย</h1>
                            <p className="text-xs text-green-100">จัดการข้อมูลรับซื้ออ้อย</p>
                        </div>
                    </div>

                    <nav className="flex space-x-4">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <PlusCircle size={18} />
                            <span>บันทึกบิล</span>
                        </NavLink>

                        <NavLink
                            to="/bills"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <List size={18} />
                            <span>รายการบิลทั้งหมด</span>
                        </NavLink>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <SettingsIcon size={18} />
                            <span>ตั้งค่า</span>
                        </NavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
