import React, { useState } from 'react';
import { Settings, LogOut, Users, Activity, Plus, ChevronDown, Trash2 } from 'lucide-react';
// IMPORTANTE: Importando o supabase padrão E o silencioso
import { supabase, supabaseAdminAuth } from '../supabaseClient';

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function AdminDashboard({ users, setUsers, exercises, setExercises, workouts, setWorkouts, onLogout }) {
  const [activeTab, setActiveTab] = useState('alunos');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 bg-[#1E1E1E] p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-3">
          <Settings className="text-[#897F9C]" size={28} />
          <h2 className="text-xl font-bold text-white">Painel Gerencial</h2>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-[#9C0100] transition-colors">
          <LogOut size={24} />
        </button>
      </header>

      <div className="flex gap-2 md:gap-4 mb-8 bg-[#1E1E1E] p-2 rounded-xl border border-gray-800 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('alunos')} 
          className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === 'alunos' ? 'bg-[#005A9C] text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <Users size={18} /> Alunos e Fichas
        </button>
        <button 
          onClick={() => setActiveTab('exercicios')} 
          className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === 'exercicios' ? 'bg-[#009C0B] text-white' : 'text-gray-400 hover:bg-gray-800'}`}
        >
          <Activity size={18} /> Banco de Exercícios
        </button>
      </div>

      {activeTab === 'alunos' ? (
        <AdminStudentsTab 
          users={users} setUsers={setUsers} 
          exercises={exercises} 
          workouts={workouts} setWorkouts={setWorkouts} 
        />
      ) : (
        <AdminExercisesTab 
          exercises={exercises} setExercises={setExercises} 
        />
      )}
    </div>
  );
}

function AdminStudentsTab({ users, setUsers, exercises, workouts, setWorkouts }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  
  const [newU, setNewU] = useState('');
  const [newP, setNewP] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newLocation, setNewLocation] = useState('Academia');
  const [loading, setLoading] = useState(false);

  // Filtra apenas os alunos da lista de usuários
  const alunos = users.filter(u => u.role === 'aluno');

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    // Regra do Supabase: A senha precisa ter pelo menos 6 caracteres
    if (newP.length < 6) {
      alert("A senha provisória precisa ter no mínimo 6 caracteres!");
      return;
    }

    setLoading(true);
    const fakeEmail = `${newU}@ironforge.app`;

    // 1. Dispara a criação no Auth usando o cliente silencioso
    const { error } = await supabaseAdminAuth.auth.signUp({
      email: fakeEmail,
      password: newP,
      options: {
        data: { username: newU, role: 'aluno', name: newName, gender: newGender, location: newLocation, needs_password_change: true }
      }
    });

    if (error) {
      setLoading(false);
      alert("Erro ao criar usuário: " + error.message);
      return;
    }

    // 2. Busca a lista atualizada de alunos no banco para pegar o ID gerado pelo Trigger
    const { data: updatedUsers } = await supabase.from('profiles').select('*').eq('role', 'aluno');
    if (updatedUsers) {
      setUsers(updatedUsers);
    }
    
    setLoading(false);
    setShowNewStudentModal(false);
    setNewU(''); setNewP(''); setNewName('');
    alert("Aluno cadastrado com SUCESSO!");
  };

  const getWorkoutForSelected = () => workouts.find(w => w.studentId === selectedStudent && w.dayOfWeek === selectedDay);

  const toggleFreeWorkout = () => {
    if(!selectedStudent) return;
    const existing = getWorkoutForSelected();
    if(existing) {
      setWorkouts(workouts.map(w => w.id === existing.id ? { ...w, isFreeWorkout: !w.isFreeWorkout, items: [] } : w));
    } else {
      setWorkouts([...workouts, { id: Date.now().toString(), studentId: selectedStudent, dayOfWeek: selectedDay, isFreeWorkout: true, items: [] }]);
    }
  };

  const addExerciseToDay = (exerciseId) => {
    if(!selectedStudent || !exerciseId) return;
    const existing = getWorkoutForSelected();
    const newItem = { id: Date.now().toString(), exerciseId, sets: 3, reps: 12 };
    
    if(existing) {
      setWorkouts(workouts.map(w => w.id === existing.id ? { ...w, isFreeWorkout: false, items: [...w.items, newItem] } : w));
    } else {
      setWorkouts([...workouts, { id: Date.now().toString(), studentId: selectedStudent, dayOfWeek: selectedDay, isFreeWorkout: false, items: [newItem] }]);
    }
  };

  const removeExerciseFromDay = (workoutId, itemId) => {
    setWorkouts(workouts.map(w => w.id === workoutId ? { ...w, items: w.items.filter(i => i.id !== itemId) } : w));
  };

  const currentWorkout = getWorkoutForSelected();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1E1E1E] p-6 rounded-xl border border-gray-800">
        <div className="relative w-full md:w-1/2">
          <select 
            className="w-full appearance-none bg-[#121212] border border-gray-700 text-white p-3 rounded-xl focus:border-[#005A9C] outline-none cursor-pointer"
            value={selectedStudent} 
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Selecione um Aluno...</option>
            {alunos.map(a => <option key={a.id} value={a.id}>{a.name} ({a.username})</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
        </div>
        <button onClick={() => setShowNewStudentModal(true)} className="w-full md:w-auto bg-[#005A9C] hover:bg-[#009C9A] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
          <Plus size={20} /> Novo Aluno
        </button>
      </div>

      {selectedStudent && (
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6">
            {DIAS_SEMANA.map(dia => (
              <button 
                key={dia} 
                onClick={() => setSelectedDay(dia)}
                className={`py-2 px-1 rounded-lg text-sm font-bold transition-colors ${selectedDay === dia ? 'bg-[#897F9C] text-white' : 'bg-[#121212] text-gray-400 hover:bg-gray-800 border border-gray-700'}`}
              >
                {dia.substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#009C9A]">Treino de {selectedDay}</h3>
            <button onClick={toggleFreeWorkout} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${currentWorkout?.isFreeWorkout ? 'bg-[#009C0B] text-white' : 'bg-[#121212] border border-gray-700 text-gray-300 hover:bg-gray-800'}`}>
              {currentWorkout?.isFreeWorkout ? '✓ Dia de Treino Livre' : 'Definir como Treino Livre'}
            </button>
          </div>

          {!currentWorkout?.isFreeWorkout && (
            <>
              <div className="relative mb-6">
                <select 
                  className="w-full appearance-none bg-[#121212] border border-gray-700 text-white p-3 rounded-xl focus:border-[#897F9C] outline-none cursor-pointer"
                  onChange={(e) => { addExerciseToDay(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                >
                  <option value="" disabled>+ Adicionar Exercício ao dia de {selectedDay}...</option>
                  {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
              </div>

              <div className="space-y-3">
                {currentWorkout?.items?.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum exercício cadastrado para {selectedDay}.</p>}
                {currentWorkout?.items?.map((item, idx) => {
                  const ex = exercises.find(e => e.id === item.exerciseId);
                  return (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#121212] p-4 rounded-xl border border-gray-800 gap-4">
                      <div className="flex items-center gap-4 text-white">
                        <div className="bg-[#1E1E1E] text-gray-400 w-8 h-8 rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                        <span className="font-bold">{ex?.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input type="number" className="w-16 bg-[#1E1E1E] border border-gray-700 text-white rounded-lg p-2 text-center" value={item.sets} onChange={() => {}} />
                          <span className="text-gray-400 text-sm">Séries</span>
                        </div>
                        <span className="text-gray-600">x</span>
                        <div className="flex items-center gap-2">
                          <input type="number" className="w-16 bg-[#1E1E1E] border border-gray-700 text-white rounded-lg p-2 text-center" value={item.reps} onChange={() => {}} />
                          <span className="text-gray-400 text-sm">Reps</span>
                        </div>
                        <button onClick={() => removeExerciseFromDay(currentWorkout.id, item.id)} className="text-gray-500 hover:text-[#9C0100] p-2 bg-[#1E1E1E] rounded-lg transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {showNewStudentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] p-6 rounded-2xl w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Cadastrar Novo Aluno</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newName} onChange={e => setNewName(e.target.value)} required />
              <input type="text" placeholder="Usuário para login (sem espaços)" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newU} onChange={e => setNewU(e.target.value.toLowerCase().trim())} required />
              <input type="text" placeholder="Senha provisória (min. 6 caracteres)" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newP} onChange={e => setNewP(e.target.value)} required minLength={6} />
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Local</label>
                  <select className="w-full bg-[#121212] text-white border border-gray-700 p-3 rounded-xl appearance-none" value={newLocation} onChange={e => setNewLocation(e.target.value)}>
                    <option value="Academia">Academia</option>
                    <option value="Casa">Casa</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Sexo</label>
                  <select className="w-full bg-[#121212] text-white border border-gray-700 p-3 rounded-xl appearance-none" value={newGender} onChange={e => setNewGender(e.target.value)}>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewStudentModal(false)} className="flex-1 bg-[#121212] border border-gray-700 py-3 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#009C9A] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminExercisesTab({ exercises, setExercises }) {
  const [exName, setExName] = useState('');
  const [exGifMFile, setExGifMFile] = useState(null);
  const [exGifFFile, setExGifFFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if(!exName) return;
    setLoading(true);

    let urlM = null;
    let urlF = null;

    if (exGifMFile) {
      const fileExt = exGifMFile.name.split('.').pop();
      const fileName = `${Date.now()}_m.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('gifs').upload(fileName, exGifMFile);
      if (!uploadError) urlM = supabase.storage.from('gifs').getPublicUrl(fileName).data.publicUrl;
    }

    if (exGifFFile) {
      const fileExt = exGifFFile.name.split('.').pop();
      const fileName = `${Date.now()}_f.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('gifs').upload(fileName, exGifFFile);
      if (!uploadError) urlF = supabase.storage.from('gifs').getPublicUrl(fileName).data.publicUrl;
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert([{ name: exName, gif_url_male: urlM, gif_url_female: urlF }])
      .select()
      .single();

    if (data) setExercises([...exercises, data]);
    
    setLoading(false);
    setExName(''); setExGifMFile(null); setExGifFFile(null);
    e.target.reset(); 
  };

  const deleteExercise = async (id) => {
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(exercises.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddExercise} className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800 space-y-4">
        <h3 className="text-xl font-bold text-[#009C0B] mb-4">Adicionar Novo Exercício</h3>
        <div>
          <label className="block text-sm text-gray-400 mb-1 ml-1">Nome do Exercício</label>
          <input type="text" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3 focus:outline-none focus:border-[#009C0B]" value={exName} onChange={e => setExName(e.target.value)} required />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-[#121212] p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2">Upload GIF (Masculino)</label>
            <input type="file" accept="image/gif, image/jpeg, image/png, video/mp4" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#005A9C] file:text-white hover:file:bg-[#009C9A] transition-all cursor-pointer" onChange={e => setExGifMFile(e.target.files[0])} />
          </div>
          <div className="flex-1 bg-[#121212] p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2">Upload GIF (Feminino)</label>
            <input type="file" accept="image/gif, image/jpeg, image/png, video/mp4" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#005A9C] file:text-white hover:file:bg-[#009C9A] transition-all cursor-pointer" onChange={e => setExGifFFile(e.target.files[0])} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full md:w-auto bg-[#009C0B] hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl transition-colors mt-2 disabled:opacity-50">
          {loading ? 'Fazendo Upload e Salvando...' : 'Salvar Exercício e Arquivos'}
        </button>
      </form>

      <div className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800">
        <h3 className="text-lg font-bold mb-4 text-white">Exercícios Cadastrados ({exercises.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map(ex => (
            <div key={ex.id} className="flex justify-between items-center bg-[#121212] p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3">
                {(ex.gif_url_male || ex.gif_url_female) && <img src={ex.gif_url_male || ex.gif_url_female} className="w-10 h-10 rounded object-cover border border-gray-600" alt="thumb" />}
                <span className="font-bold text-white">{ex.name}</span>
              </div>
              <button onClick={() => deleteExercise(ex.id)} className="text-gray-500 hover:text-[#9C0100] transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}