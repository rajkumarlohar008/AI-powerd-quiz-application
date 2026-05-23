import React from 'react'
import HomePage from './components/HomePage';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import AiQuizGenerator from './components/AiQuizGenerator';
import QuizHistory from './components/QuizHistory';
// import {  Link } from 'react-router-dom';

const App = () => {
  return (
    <div className='min-h-screen w-full'>
      
      <Router>
        
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz" element={<Quiz />}/>
          <Route path="/ai-quiz" element={<AiQuizGenerator />}/>
          <Route path="/history" element={<QuizHistory />}/>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
