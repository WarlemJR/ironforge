import React, { useState } from 'react';
import { Settings, LogOut, Users, Activity, Plus, ChevronDown, Trash2, Save, Edit2, X } from 'lucide-react';
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
        <AdminStudentsTab users={users} setUsers={setUsers} exercises={exercises} workouts={workouts} setWorkouts={setWorkouts} />
      ) : (
        <AdminExercisesTab exercises={exercises} setExercises={setExercises} />
      )}
    </div>
  );
}

function AdminStudentsTab({ users, setUsers, exercises, workouts, setWorkouts }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  
  const [newU, setNewU] = useState('');
  const [newP, setNewP] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('M');
  const [newLocation, setNewLocation] = useState('Academia');
  const [loading, setLoading] = useState(false);

  const alunos = users.filter(u => u.role === 'aluno');

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (newP.length < 6) return alert("A senha precisa ter no mínimo 6 caracteres!");

    setLoading(true);
    const { error } = await supabaseAdminAuth.auth.signUp({
      email: `${newU}@ironforge.app`,
      password: newP,
      options: { data: { username: newU, role: 'aluno', name: newName, gender: newGender, location: newLocation, needs_password_change: true } }
    });

    if (error) { setLoading(false); return alert("Erro: " + error.message); }

    const { data: updatedUsers } = await supabase.from('profiles').select('*').eq('role', 'aluno');
    if (updatedUsers) setUsers(updatedUsers);
    
    setLoading(false); setShowNewStudentModal(false); setNewU(''); setNewP(''); setNewName('');
    alert("Aluno cadastrado com sucesso!");
  };

  const getWorkoutForSelected = () => workouts.find(w => w.studentId === selectedStudent && w.dayOfWeek === selectedDay);

  const toggleFreeWorkout = () => {
    if(!selectedStudent) return;
    const existing = getWorkoutForSelected();
    if(existing) {
      setWorkouts(workouts.map(w => w.id === existing.id ? { ...w, isFreeWorkout: !w.isFreeWorkout, items: [] } : w));
    } else {
      setWorkouts([...workouts, { id: crypto.randomUUID(), studentId: selectedStudent, dayOfWeek: selectedDay, isFreeWorkout: true, items: [] }]);
    }
  };

  const addExerciseToDay = (exerciseId) => {
    if(!selectedStudent || !exerciseId) return;
    const existing = getWorkoutForSelected();
    const newItem = { id: crypto.randomUUID(), exerciseId, sets: 3, reps: 12, duration: '' };
    
    if(existing) {
      setWorkouts(workouts.map(w => w.id === existing.id ? { ...w, isFreeWorkout: false, items: [...w.items, newItem] } : w));
    } else {
      setWorkouts([...workouts, { id: crypto.randomUUID(), studentId: selectedStudent, dayOfWeek: selectedDay, isFreeWorkout: false, items: [newItem] }]);
    }
  };

  const updateExerciseItem = (workoutId, itemId, field, value) => {
    setWorkouts(workouts.map(w => w.id === workoutId ? { ...w, items: w.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : w));
  };

  const removeExerciseFromDay = (workoutId, itemId) => {
    setWorkouts(workouts.map(w => w.id === workoutId ? { ...w, items: w.items.filter(i => i.id !== itemId) } : w));
  };

  // FUNÇÃO MESTRA: SALVAR FICHA NO BANCO DE DADOS
  const handleSaveWorkout = async () => {
    const w = getWorkoutForSelected();
    if (!w) return alert("Adicione algo à ficha antes de salvar.");

    setLoadingSave(true);

    // 1. Salva ou atualiza a capa da ficha (Upsert)
    const { error: wError } = await supabase.from('workouts').upsert({
      id: w.id,
      student_id: w.studentId,
      day_of_week: w.dayOfWeek,
      is_free_workout: w.isFreeWorkout
    });

    if (wError) {
      setLoadingSave(false);
      return alert('Erro ao salvar ficha: ' + wError.message);
    }

    // 2. Limpa os exercícios antigos no banco (para a edição funcionar perfeitamente)
    await supabase.from('workout_items').delete().eq('workout_id', w.id);

    // 3. Salva os exercícios novos/editados
    if (!w.isFreeWorkout && w.items.length > 0) {
      const itemsToInsert = w.items.map(item => ({
        id: item.id,
        workout_id: w.id,
        exercise_id: item.exerciseId,
        sets: item.sets ? parseInt(item.sets) : null,
        reps: item.reps ? parseInt(item.reps) : null,
        duration: item.duration || null
      }));

      const { error: iError } = await supabase.from('workout_items').insert(itemsToInsert);
      if (iError) {
        setLoadingSave(false);
        return alert('Erro ao salvar exercícios: ' + iError.message);
      }
    }

    setLoadingSave(false);
    alert(`✅ Ficha de ${selectedDay} salva com sucesso no Banco de Dados!`);
  };

  const currentWorkout = getWorkoutForSelected();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1E1E1E] p-6 rounded-xl border border-gray-800">
        <div className="relative w-full md:w-1/2">
          <select 
            className="w-full appearance-none bg-[#121212] border border-gray-700 text-white p-3 rounded-xl focus:border-[#005A9C] outline-none cursor-pointer"
            value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
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
        <div className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6">
            {DIAS_SEMANA.map(dia => (
              <button 
                key={dia} onClick={() => setSelectedDay(dia)}
                className={`py-2 px-1 rounded-lg text-sm font-bold transition-colors ${selectedDay === dia ? 'bg-[#897F9C] text-white shadow-lg' : 'bg-[#121212] text-gray-400 hover:bg-gray-800 border border-gray-700'}`}
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
                  onChange={(e) => { addExerciseToDay(e.target.value); e.target.value = ""; }} defaultValue=""
                >
                  <option value="" disabled>+ Adicionar Exercício à Ficha...</option>
                  {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
              </div>

              <div className="space-y-3">
                {(!currentWorkout?.items || currentWorkout.items.length === 0) && <p className="text-gray-500 text-center py-4">Nenhum exercício cadastrado. A ficha está vazia.</p>}
                
                {currentWorkout?.items?.map((item, idx) => {
                  const ex = exercises.find(e => e.id === item.exerciseId);
                  return (
                    <div key={item.id} className="flex flex-col xl:flex-row xl:items-center justify-between bg-[#121212] p-4 rounded-xl border border-gray-800 gap-4 group">
                      <div className="flex items-center gap-4 text-white">
                        <div className="bg-[#1E1E1E] text-gray-400 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                        <span className="font-bold">{ex?.name}</span>
                      </div>
                      
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input type="number" className="w-16 bg-[#1E1E1E] border border-gray-700 text-white rounded-lg p-2 text-center focus:border-[#005A9C] outline-none" value={item.sets || ''} onChange={(e) => updateExerciseItem(currentWorkout.id, item.id, 'sets', e.target.value)} />
                          <span className="text-gray-400 text-sm">Séries</span>
                        </div>
                        <span className="text-gray-600 hidden md:block">x</span>
                        <div className="flex items-center gap-2">
                          <input type="number" className="w-16 bg-[#1E1E1E] border border-gray-700 text-white rounded-lg p-2 text-center focus:border-[#005A9C] outline-none" value={item.reps || ''} onChange={(e) => updateExerciseItem(currentWorkout.id, item.id, 'reps', e.target.value)} />
                          <span className="text-gray-400 text-sm">Reps</span>
                        </div>
                        <span className="text-gray-600 hidden md:block">ou</span>
                        <div className="flex items-center gap-2">
                          <input type="text" placeholder="Ex: 1 min" className="w-24 bg-[#1E1E1E] border border-gray-700 text-white rounded-lg p-2 text-center focus:border-[#005A9C] outline-none" value={item.duration || ''} onChange={(e) => updateExerciseItem(currentWorkout.id, item.id, 'duration', e.target.value)} />
                          <span className="text-gray-400 text-sm">Tempo</span>
                        </div>
                        <button onClick={() => removeExerciseFromDay(currentWorkout.id, item.id)} className="text-gray-500 hover:text-[#9C0100] p-2 bg-[#1E1E1E] rounded-lg transition-colors ml-auto md:ml-0">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* BOTÃO DE SALVAR FICHA */}
          {currentWorkout && (
             <button 
               onClick={handleSaveWorkout}
               disabled={loadingSave}
               className="w-full mt-6 bg-[#009C0B] hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
             >
               <Save size={24} />
               {loadingSave ? 'Salvando no Banco...' : `Salvar Ficha Definitiva: ${selectedDay}`}
             </button>
          )}
        </div>
      )}

      {/* Modal Novo Aluno (igual ao anterior) */}
      {showNewStudentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] p-6 rounded-2xl w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Cadastrar Novo Aluno</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <input type="text" placeholder="Nome Completo" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newName} onChange={e => setNewName(e.target.value)} required />
              <input type="text" placeholder="Usuário para login" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newU} onChange={e => setNewU(e.target.value.toLowerCase().trim())} required />
              <input type="text" placeholder="Senha provisória" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3" value={newP} onChange={e => setNewP(e.target.value)} required minLength={6} />
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <select className="w-full bg-[#121212] text-white border border-gray-700 p-3 rounded-xl" value={newLocation} onChange={e => setNewLocation(e.target.value)}>
                    <option value="Academia">Academia</option>
                    <option value="Casa">Casa</option>
                  </select>
                </div>
                <div className="flex-1">
                  <select className="w-full bg-[#121212] text-white border border-gray-700 p-3 rounded-xl" value={newGender} onChange={e => setNewGender(e.target.value)}>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewStudentModal(false)} className="flex-1 bg-[#121212] border border-gray-700 py-3 rounded-xl text-gray-300">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#009C9A] text-white font-bold py-3 rounded-xl disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Aluno'}</button>
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
  const [editingId, setEditingId] = useState(null);

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if(!exName) return;
    setLoading(true);

    // Se estiver editando, mantém a URL antiga como base. Se vier arquivo novo, sobrescreve.
    let urlM = editingId ? exercises.find(ex => ex.id === editingId)?.gif_url_male : null;
    let urlF = editingId ? exercises.find(ex => ex.id === editingId)?.gif_url_female : null;

    try {
      if (exGifMFile) {
        const fileName = `${Date.now()}_m.${exGifMFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('gifs').upload(fileName, exGifMFile);
        if (uploadError) throw new Error("Erro no upload do vídeo Masculino: " + uploadError.message);
        urlM = supabase.storage.from('gifs').getPublicUrl(fileName).data.publicUrl;
      }

      if (exGifFFile) {
        const fileName = `${Date.now()}_f.${exGifFFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('gifs').upload(fileName, exGifFFile);
        if (uploadError) throw new Error("Erro no upload do vídeo Feminino: " + uploadError.message);
        urlF = supabase.storage.from('gifs').getPublicUrl(fileName).data.publicUrl;
      }

      if (editingId) {
        const { data, error } = await supabase
          .from('exercises')
          .update({ name: exName, gif_url_male: urlM, gif_url_female: urlF })
          .eq('id', editingId)
          .select()
          .single();
        if (error) throw new Error("Erro ao atualizar banco: " + error.message);
        if (data) setExercises(exercises.map(ex => ex.id === editingId ? data : ex));
      } else {
        const { data, error } = await supabase
          .from('exercises')
          .insert([{ name: exName, gif_url_male: urlM, gif_url_female: urlF }])
          .select()
          .single();
        if (error) throw new Error("Erro ao salvar no banco: " + error.message);
        if (data) setExercises([...exercises, data]);
      }

      setExName(''); setExGifMFile(null); setExGifFFile(null); setEditingId(null);
      e.target.reset(); 
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (ex) => {
    setEditingId(ex.id);
    setExName(ex.name);
    setExGifMFile(null);
    setExGifFFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExName('');
    setExGifMFile(null);
    setExGifFFile(null);
  };

  const deleteExercise = async (id) => {
    if(window.confirm("Tem certeza que deseja apagar este exercício?")) {
        await supabase.from('exercises').delete().eq('id', id);
        setExercises(exercises.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveExercise} className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800 space-y-4">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-xl font-bold text-[#009C0B]">
             {editingId ? '✏️ Editar Exercício' : 'Adicionar Novo Exercício'}
           </h3>
           {editingId && (
             <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-[#121212] px-3 py-2 rounded-lg border border-gray-700 transition-colors">
                <X size={16} /> Cancelar Edição
             </button>
           )}
        </div>
        
        <input type="text" placeholder="Nome do Exercício" className="w-full bg-[#121212] text-white border border-gray-700 rounded-xl p-3 focus:outline-none focus:border-[#009C0B]" value={exName} onChange={e => setExName(e.target.value)} required />
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-[#121212] p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              {editingId ? 'Substituir Vídeo (Masculino)' : 'GIF/Vídeo (Masculino)'}
            </label>
            <input type="file" accept="video/mp4, video/webm, image/gif" className="text-sm text-gray-400 w-full" onChange={e => setExGifMFile(e.target.files[0])} />
            {editingId && !exGifMFile && exercises.find(e=>e.id===editingId)?.gif_url_male && (
                <p className="text-xs text-[#009C0B] mt-2 font-bold">✓ Vídeo atual será mantido</p>
            )}
          </div>
          <div className="flex-1 bg-[#121212] p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              {editingId ? 'Substituir Vídeo (Feminino)' : 'GIF/Vídeo (Feminino)'}
            </label>
            <input type="file" accept="video/mp4, video/webm, image/gif" className="text-sm text-gray-400 w-full" onChange={e => setExGifFFile(e.target.files[0])} />
            {editingId && !exGifFFile && exercises.find(e=>e.id===editingId)?.gif_url_female && (
                <p className="text-xs text-[#009C0B] mt-2 font-bold">✓ Vídeo atual será mantido</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#009C0B] hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition-colors mt-2 disabled:opacity-50 shadow-lg">
          {loading ? 'Salvando no Banco...' : (editingId ? 'Atualizar Exercício Definitivo' : 'Salvar Novo Exercício')}
        </button>
      </form>
      
      <div className="bg-[#1E1E1E] p-6 rounded-xl border border-gray-800">
        <h3 className="text-lg font-bold mb-4 text-white">Exercícios Cadastrados ({exercises.length})</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {exercises.map(ex => (
            <div key={ex.id} className="flex justify-between items-center bg-[#121212] p-4 rounded-xl border border-gray-700 group">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ex.gif_url_male || ex.gif_url_female ? 'bg-[#009C0B] shadow-[0_0_8px_#009C0B]' : 'bg-[#9C0100]'}`} title={ex.gif_url_male || ex.gif_url_female ? 'Possui Mídia' : 'Sem Mídia'}></div>
                 <span className="font-bold text-white uppercase text-sm md:text-base">{ex.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(ex)} className="text-gray-500 hover:text-[#005A9C] p-2 bg-[#1E1E1E] rounded-lg transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => deleteExercise(ex.id)} className="text-gray-500 hover:text-[#9C0100] p-2 bg-[#1E1E1E] rounded-lg transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}