import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para guardar os dados do Supabase
  const [usersMock, setUsersMock] = useState([]); 
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);

  // Função para buscar dados iniciais após o login
  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    // Busca todos os exercícios cadastrados
    const { data: exData } = await supabase.from('exercises').select('*');
    if (exData) setExercises(exData);

    // Se for admin, busca a lista de alunos
    if (currentUser.role === 'admin') {
      const { data: usersData } = await supabase.from('users').select('*').eq('role', 'aluno');
      if (usersData) setUsersMock(usersData);
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  if (currentUser.needs_password_change) {
    return <ChangePassword user={currentUser} onPasswordChanged={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#009C9A] selection:text-white">
      {currentUser.role === 'admin' ? (
        <AdminDashboard 
          users={usersMock} setUsers={setUsersMock} 
          exercises={exercises} setExercises={setExercises}
          workouts={workouts} setWorkouts={setWorkouts}
          onLogout={() => setCurrentUser(null)} 
        />
      ) : (
        <UserDashboard 
          currentUser={currentUser}
          exercises={exercises}
          workouts={workouts}
          onLogout={() => setCurrentUser(null)} 
        />
      )}
    </div>
  );
}