import React, { useState } from 'react';
import Header from '../components/layout/Header';
import TabBar, { type TabId } from '../components/layout/TabBar';
import Footer from '../components/layout/Footer';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import CalendarView from '../components/calendar/CalendarView';
import ProductionView from '../components/production/ProductionView';
import MediaGallery from '../components/media/MediaGallery';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabBar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'production' && <ProductionView />}
        {activeTab === 'media' && <MediaGallery />}
      </main>
      <Footer />
    </div>
  );
}
