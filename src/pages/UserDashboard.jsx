import React, { useState, useEffect } from 'react';
import { CheckCircle2, SkipForward, LogOut } from 'lucide-react';

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function UserDashboard({ currentUser, exercises, workouts, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [todayStr, setTodayStr] = useState('');
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const todayName = DIAS_SEMANA[todayIndex];
    setTodayStr(todayName);

    const workoutToday = workouts.find(w => w.studentId === currentUser.id && w.dayOfWeek === todayName);

    if (workoutToday) {
      setIsFree(workoutToday.isFreeWorkout);
      setQueue(workoutToday.items || []);
    } else {
      setIsFree(false);
      setQueue([]);
    }
  }, [workouts, currentUser]);

  const handleComplete = () => {
    setQueue(prev => prev.slice(1));
  };

  const handleSkip = () => {
    setQueue(prev => {
      if (prev.length <= 1) return prev;
      const newQ = [...prev];
      const skipped = newQ.shift();
      newQ.push(skipped);
      return newQ;
    });
  };

  if (isFree) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4 flex flex-col items-center justify-center relative">
        <header className="absolute top-4 w-full px-4 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Olá, {currentUser.name}</p>
            <h1 className="text-xl font-bold text-[#009C0B]">Treino Livre</h1>
          </div>
          <button onClick={onLogout} className="p-3 bg-[#1E1E1E] rounded-full text-gray-400 hover:text-[#9C0100] transition-colors">
            <LogOut size={20} />
          </button>
        </header>
        <div className="text-center space-y-4 max-w-sm">
          <span className="text-6xl block mb-4">🔥</span>
          <h2 className="text-2xl font-bold">Hoje o treino é livre!</h2>
          <p className="text-gray-400">Aproveite para focar no que você mais gosta ou fazer um cardio de respeito.</p>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4 flex flex-col items-center justify-center relative">
        <header className="absolute top-4 w-full px-4 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Olá, {currentUser.name}</p>
            <h1 className="text-xl font-bold text-[#005A9C]">Treino de {todayStr}</h1>
          </div>
          <button onClick={onLogout} className="p-3 bg-[#1E1E1E] rounded-full text-gray-400 hover:text-[#9C0100] transition-colors">
            <LogOut size={20} />
          </button>
        </header>
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 size={64} className="text-[#009C0B] mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Treino Concluído!</h2>
          <p className="text-gray-400">Você finalizou todos os exercícios da ficha de hoje. Excelente trabalho!</p>
        </div>
      </div>
    );
  }

  const currentItem = queue[0];
  const currentEx = exercises.find(e => e.id === currentItem.exerciseId);
  
  // Decide se usa o GIF masculino ou feminino
  const mediaUrl = currentUser.gender === 'F' && currentEx?.gif_url_female 
    ? currentEx.gif_url_female 
    : currentEx?.gif_url_male;
    
  // Verifica se o arquivo é um vídeo MP4 ou WebM para usar a tag HTML <video>
  const isVideo = mediaUrl && (mediaUrl.toLowerCase().includes('.mp4') || mediaUrl.toLowerCase().includes('.webm'));

  return (
    <div className="min-h-[100dvh] bg-[#121212] text-white font-sans p-4 flex flex-col">
      <header className="flex justify-between items-start mb-6">
        <div>
          <p className="text-gray-400 text-sm">Olá, {currentUser.name}</p>
          <h1 className="text-2xl font-bold text-[#005A9C]">Treino de Hoje</h1>
          <span className="inline-block mt-1 bg-[#1E1E1E] border border-gray-800 text-gray-400 text-xs px-2 py-1 rounded-md">
            {todayStr}
          </span>
        </div>
        <button onClick={onLogout} className="p-3 bg-[#1E1E1E] rounded-full border border-gray-800 text-gray-400 hover:text-[#9C0100] transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full pb-4">
        <div className="bg-[#1E1E1E] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col relative flex-1">
          
          <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold z-10 backdrop-blur-sm border border-white/10">
            Faltam: {queue.length}
          </div>
          
          {/* Renderizador de Mídia (Forçando Autoplay Mudo no Mobile) */}
          <div className="h-[40vh] min-h-[250px] bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
            {mediaUrl ? (
              isVideo ? (
                <video 
                  src={mediaUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={mediaUrl} alt={currentEx?.name} className="w-full h-full object-cover" />
              )
            ) : (
              <span className="text-gray-600 font-bold text-sm tracking-widest">SEM VÍDEO</span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <h2 className="text-2xl font-black text-center mb-6 uppercase tracking-wider text-white">
              {currentEx?.name}
            </h2>
            
            <div className="flex gap-4 mb-8">
              {currentItem.duration ? (
                // Se existe "TEMPO", exibe TEMPO e oculta "REPS". Só exibe "SÉRIES" se o admin colocou > 0.
                <>
                  {currentItem.sets > 0 && (
                    <div className="flex-1 bg-[#121212] border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Séries</span>
                      <span className="text-3xl font-black text-[#009C9A]">{currentItem.sets}</span>
                    </div>
                  )}
                  <div className="flex-1 bg-[#121212] border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Tempo</span>
                    <span className="text-3xl font-black text-[#009C9A]">{currentItem.duration}</span>
                  </div>
                </>
              ) : (
                // Padrão: SÉRIES e REPS
                <>
                  <div className="flex-1 bg-[#121212] border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Séries</span>
                    <span className="text-3xl font-black text-[#009C9A]">{currentItem.sets}</span>
                  </div>
                  <div className="flex-1 bg-[#121212] border border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Reps</span>
                    <span className="text-3xl font-black text-[#009C9A]">{currentItem.reps}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto space-y-3">
              <button 
                onClick={handleComplete}
                className="w-full bg-[#005A9C] hover:bg-[#009C9A] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                <CheckCircle2 size={24} />
                Concluído
              </button>
              
              {queue.length > 1 && (
                <button 
                  onClick={handleSkip}
                  className="w-full bg-[#121212] border border-gray-800 text-gray-400 hover:text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <SkipForward size={20} />
                  Pular esse exercício
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}