import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';

const HowToPlayPage = lazy(() => import('./pages/HowToPlayPage'));
const RulebookPage = lazy(() => import('./pages/RulebookPage'));
const MapGeneratorPage = lazy(() => import('./pages/MapGeneratorPage'));
const ComponentsPage = lazy(() => import('./pages/ComponentsPage'));
const PrintExportPage = lazy(() => import('./pages/PrintExportPage'));
const Print3dPage = lazy(() => import('./pages/Print3dPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="how-to-play" element={<HowToPlayPage />} />
        <Route path="rulebook" element={<RulebookPage />} />
        <Route path="map-generator" element={<MapGeneratorPage />} />
        <Route path="components" element={<ComponentsPage />} />
        <Route path="print-export" element={<PrintExportPage />} />
        <Route path="3d-printing" element={<Print3dPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
