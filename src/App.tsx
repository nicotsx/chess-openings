import { Route, Routes } from 'react-router';
import './App.css';
import { Trainer } from './pages/trainer';

function App() {
  return (
    <Routes>
      <Route index element={<Trainer />} />
    </Routes>
  );
}

// biome-ignore lint/style/noDefaultExport: Needed for entry point
export default App;
