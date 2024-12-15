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

export default App;
