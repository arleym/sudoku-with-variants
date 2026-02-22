import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import App3D from './App3D';

export function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/3d" element={<App3D />} />
      </Routes>
    </HashRouter>
  );
}
