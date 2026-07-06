import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import AiQuizGenerator from './components/AiQuizGenerator';
import QuizHistory from './components/QuizHistory';
import AdminDashBoard from './components/AdminDashBoard';
import RoomQuiz from './components/RoomQuiz';
import { ToastContainer } from 'react-toastify';
import PredefinedQuiz from './components/PredefinedQuiz';
import Nav from './components/Nav';

// 1. Create a helper component to manage the conditional Navbar
const AppContent = () => {
  const location = useLocation(); // Get the current path safely from React Router

  return (
    <>
      {/* If current path is NOT "/", show the Nav component */}
      {/* {location.pathname !== "/" && <Nav />} */}
      <Nav />
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
        theme="light"
      />
      {/* <PredefinedQuiz /> */}
    </>
  );
};

// 2. Keep the main App component clean, wrapping everything in the Router
const App = () => {
  return (
    <div className='min-h-screen w-full'>
      <Router>
        <AppContent />
      </Router>
    </div>
  )
}

export default App;