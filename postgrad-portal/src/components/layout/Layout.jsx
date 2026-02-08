// ============================================
// Layout Wrapper Component
// ============================================

import { Outlet } from 'react-router-dom';
import { TourProvider } from '../../context/GuidedTour';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

export default function Layout() {
  return (
    <TourProvider>
      <div className="layout">
        <Sidebar />
        <div className="layout-main">
          <Header />
          <main className="layout-content">
            <Outlet />
          </main>
        </div>
      </div>
    </TourProvider>
  );
}
