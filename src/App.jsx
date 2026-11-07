import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import { supabase } from './supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usersMock, setUsersMock] = useState([]); 
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]); // Será integrado ao banco no próximo passo

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    const { data: exData } = await supabase.from('exercises').select('*');
    if (exData) setExercises(exData);

    if (currentUser.role === 'admin') {
      // Agora buscamos da tabela segura 'profiles'
      const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'aluno');
      if (profilesData) setUsersMock(profilesData);
    }
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;
  
  if (currentUser.needs_password_change) return <ChangePassword user={currentUser} onPasswordChanged={setCurrentUser} />;

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