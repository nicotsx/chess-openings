import { Route, Routes } from 'react-router';
import './App.css';
import { ChessOpeningTrainer } from './pages/trainer';

function App() {
  return (
    <Routes>
      <Route index element={<ChessOpeningTrainer />} />
    </Routes>
  );
}

export default App;
