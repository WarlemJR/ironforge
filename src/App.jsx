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
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    // 1. Busca Exercícios
    const { data: exData } = await supabase.from('exercises').select('*');
    if (exData) setExercises(exData);

    // 2. Busca Alunos (se for admin)
    if (currentUser.role === 'admin') {
      const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'aluno');
      if (profilesData) setUsersMock(profilesData);
    }

    // 3. Busca Fichas de Treino e seus Itens do Banco de Dados real
    const { data: wData } = await supabase.from('workouts').select('*');
    const { data: iData } = await supabase.from('workout_items').select('*');

    if (wData && iData) {
      // Monta as fichas no formato do React
      const fichasMontadas = wData.map(w => ({
        id: w.id,
        studentId: w.student_id,
        dayOfWeek: w.day_of_week,
        isFreeWorkout: w.is_free_workout,
        items: iData.filter(i => i.workout_id === w.id).map(i => ({
          id: i.id,
          exerciseId: i.exercise_id,
          sets: i.sets,
          reps: i.reps,
          duration: i.duration
        }))
      }));
      setWorkouts(fichasMontadas);
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