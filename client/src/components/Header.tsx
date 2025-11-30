import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sprout, LayoutDashboard, ScrollText, Users, History, LogOut, Settings, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 p-2 rounded-lg">
                            <Sprout className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 leading-none">Sugarcane</h1>
                            <p className="text-xs text-gray-500 font-medium">ระบบบันทึกบิลอ้อย</p>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <ScrollText size={18} />
                            <span>บันทึกบิล</span>
                        </NavLink>

                        <NavLink
                            to="/bills"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <ScrollText size={18} />
                            <span>รายการบิล</span>
                        </NavLink>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Settings size={18} />
                            <span>ตั้งค่า</span>
                        </NavLink>

                        {user?.role === 'root' && (
                            <>
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <LayoutDashboard size={18} />
                                    <span>แดชบอร์ด</span>
                                </NavLink>

                                <NavLink
                                    to="/farmers"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <Users size={18} />
                                    <span>ชาวไร่</span>
                                </NavLink>

                                <NavLink
                                    to="/logs"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <History size={18} />
                                    <span>ประวัติ</span>
                                </NavLink>

                                <NavLink
                                    to="/users"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <UserCog size={18} />
                                    <span>ผู้ใช้งาน</span>
                                </NavLink>
                            </>
                        )}
                    </nav>

                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                            <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ออกจากระบบ"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
