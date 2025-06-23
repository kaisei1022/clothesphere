
import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_NAME } from '../../constants';

const Navbar: React.FC = () => {
  const activeClassName = "bg-primary text-white";
  const inactiveClassName = "text-gray-700 hover:bg-primary/80 hover:text-white";

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold text-primary">{APP_NAME}</NavLink>
        <div className="space-x-2">
          <NavLink 
            to="/inventory" 
            className={({ isActive }) => `${isActive ? activeClassName : inactiveClassName} px-4 py-2 rounded-md transition-colors duration-200`}
          >
            在庫管理
          </NavLink>
          <NavLink 
            to="/orders" 
            className={({ isActive }) => `${isActive ? activeClassName : inactiveClassName} px-4 py-2 rounded-md transition-colors duration-200`}
          >
            注文管理
          </NavLink>
          <NavLink 
            to="/outsourcing" 
            className={({ isActive }) => `${isActive ? activeClassName : inactiveClassName} px-4 py-2 rounded-md transition-colors duration-200`}
          >
            委託管理
          </NavLink>
          {/* Settings link removed as it was tied to frontend-only auth */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
