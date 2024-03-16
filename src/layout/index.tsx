import React from "react";
import Nav from "./Nav";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col w-full h-full">
      {/* <div className="sticky top-0 z-10"> */}
      <Nav />
      {/* </div> */}
      <div className="min-h-[calc(100vh-4rem)] w-full bg-[#f7f7f7]">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
