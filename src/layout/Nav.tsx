import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NavItem = ({ name, path }: { name: string; path: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div
      onClick={() => navigate(path)}
      className={`uppercase cursor-pointer p-2 ${
        location.pathname.includes(path) && "bg-surface text-textPrimary"
      }`}
    >
      {name}
    </div>
  );
};

const Nav = () => {
  return (
    <div className="flex items-center gap-4 w-full bg-primary text-surface  text-sm p-1">
      <NavItem path="/home" name="Home" />
      <NavItem path="/schedules" name="Schedules" />
      <NavItem path="/employees" name="Employees" />
      <NavItem path="/shifts" name="Shifts" />
      <NavItem path="/trades" name="Trades" />
      <NavItem path="/patrolling" name="Patrolling" />
      <NavItem path="/incident" name="Incident" />
      <NavItem path="/send-message" name="Send Message" />
    </div>
  );
};

export default Nav;
