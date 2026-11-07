import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle, SkipForward, Play, Activity } from 'lucide-react';

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function UserDashboard({ currentUser, exercises, workouts, onLogout }) {
  const diaDeHoje = DIAS_SEMANA[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; 
  
  const todayWorkoutData = workouts.find(w => w.studentId === currentUser.id && w.dayOfWeek === diaDeHoje);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (todayWorkoutData && !todayWorkoutData.isFreeWorkout) {
      setQueue(todayWorkoutData.items);
    }
  }, [todayWorkoutData]);

  const handleComplete = () => setQueue(queue.slice(1));
  const handleSkip = () => {
    const item = queue[0];
    setQueue([...queue.slice(1), item]);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-[#121212]">
      <header className="bg-[#1E1E1E] p-6 rounded-b-3xl border-b border-gray-800 flex justify-between items-center shadow-lg">
        <div>
          <p className="text-gray-400 text-sm">Olá, {currentUser.name}</p>
          <h2 className="text-2xl font-bold text-[#005A9C]">Treino de Hoje</h2>
          <span className="inline-block mt-1 text-xs font-bold bg-[#897F9C]/20 text-[#897F9C] px-2 py-1 rounded-md">{diaDeHoje}</span>
        </div>
        <button onClick={onLogout} className="bg-[#121212] p-3 rounded-full border border-gray-700 text-gray-400 hover:text-[#9C0100] transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-md w-full mx-auto flex flex-col justify-center">
        {!todayWorkoutData ? (
          <div className="text-center bg-[#1E1E1E] p-8 rounded-3xl border border-gray-800">
            <span className="text-5xl mb-4 block">🛌</span>
            <h3 className="text-xl font-bold mb-2 text-white">Descanso</h3>
            <p className="text-gray-400">Nenhum treino cadastrado para {diaDeHoje}.</p>
          </div>
        ) : todayWorkoutData.isFreeWorkout ? (
          <div className="text-center bg-[#1E1E1E] p-8 rounded-3xl border border-[#009C0B]/30 shadow-[0_0_30px_rgba(0,156,11,0.1)]">
            <Activity size={64} className="mx-auto text-[#009C0B] mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-white">Treino Livre</h3>
            <p className="text-gray-400">Hoje o foco é com você. Esteira, bike, corrida ou alongamento longo!</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center bg-[#1E1E1E] p-8 rounded-3xl border border-[#005A9C]/30 shadow-[0_0_30px_rgba(0,90,156,0.1)]">
            <div className="bg-[#005A9C] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Treino Concluído!</h3>
            <p className="text-gray-400">Excelente trabalho hoje. Hora de recuperar.</p>
          </div>
        ) : (
          <ExerciseCard 
            item={queue[0]} 
            exerciseInfo={exercises.find(e => e.id === queue[0].exerciseId)} 
            gender={currentUser.gender}
            onComplete={handleComplete} 
            onSkip={handleSkip} 
            remaining={queue.length - 1} 
          />
        )}
      </main>
    </div>
  );
}

function ExerciseCard({ item, exerciseInfo, gender, onComplete, onSkip, remaining }) {
  const gifUrl = gender === 'F' && exerciseInfo?.gif_url_female ? exerciseInfo.gif_url_female : exerciseInfo?.gif_url_male;
  
  return (
    <div className="bg-[#1E1E1E] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col h-full max-h-[700px]">
      <div className="relative h-64 bg-gray-900 border-b border-gray-800">
        {gifUrl ? (
          <img src={gifUrl} alt="Execução do exercício" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600"><Play size={48} /></div>
        )}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
          Faltam: {remaining}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-black mb-6 text-center tracking-tight text-white">{exerciseInfo?.name || 'Exercício'}</h3>
        
        <div className="flex gap-4 mb-8 justify-center">
          <div className="bg-[#121212] flex-1 py-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center">
            <span className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Séries</span>
            <span className="text-3xl font-black text-[#009C9A]">{item.sets}</span>
          </div>
          <div className="bg-[#121212] flex-1 py-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center">
            <span className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Reps</span>
            <span className="text-3xl font-black text-[#009C9A]">{item.reps}</span>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button onClick={onComplete} className="w-full bg-[#005A9C] hover:bg-[#009C9A] text-white active:scale-95 transition-all py-4 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 text-lg">
            <CheckCircle size={24} /> Concluído
          </button>
          <button onClick={onSkip} className="w-full bg-[#121212] border border-gray-700 active:scale-95 transition-all py-4 rounded-2xl font-bold flex justify-center items-center gap-2 text-gray-400 hover:text-white">
            <SkipForward size={24} /> Pular para o final
          </button>
        </div>
      </div>
    </div>
  );
}