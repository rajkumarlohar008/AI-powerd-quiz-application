import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AiQuizGenerator from './components/AiQuizGenerator';
import QuizHistory from './components/QuizHistory';
import AdminDashBoard from './components/AdminDashBoard';
import RoomQuiz from './components/RoomQuiz';
import { ToastContainer } from 'react-toastify';
import PredefinedQuiz from './components/PredefinedQuiz';
import Nav from './components/Nav';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AppContent = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  return (
    <>
      {location.pathname === "/" ? '' : <Nav />}
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quiz" element={<PredefinedQuiz />} />
        <Route path="/ai-quiz" element={<AiQuizGenerator />} />
        <Route path="/history" element={<QuizHistory />} />
        <Route path="/admin" element={<AdminDashBoard />} />
        <Route path="/room" element={<RoomQuiz />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <div className='min-h-screen w-full'>
        <Router>
          <AppContent />
        </Router>
      </div>
    </ThemeProvider>
  )
}

export default App;
