import React from "react";
import { AnimationProvider } from "../contexts/AnimationContext";
import AnimatedLayout from "./AnimatedLayout";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * @typedef {Object} MainLayoutProps
 * @property {React.ReactNode} children - The content to be rendered within the layout
 */

/**
 * MainLayout component that wraps the entire application with animation providers
 * and consistent layout components
 *
 * @param {MainLayoutProps} props
 */
const MainLayout = ({ children }) => {
  return (
    <AnimationProvider>
      <AnimatedLayout>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow pt-16">{children}</main>
          <Footer />
        </div>
      </AnimatedLayout>
    </AnimationProvider>
  );
};

export default MainLayout;
