import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fakeEmail = `${username}@ironforge.app`;

    // PASSO 1: Tenta logar no cofre de Autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password
    });

    if (authError) {
      setLoading(false);
      return setError('❌ Erro de Autenticação: ' + authError.message);
    }

    // PASSO 2: Tenta buscar os dados na tabela Profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      setLoading(false);
      return setError('❌ Erro no Banco de Dados (Profiles): ' + profileError.message);
    }

    if (!profile) {
      setLoading(false);
      return setError('❌ O seu perfil não foi criado na tabela "profiles" pelo Trigger.');
    }

    // Se chegou até aqui, deu tudo certo!
    setLoading(false);
    onLogin(profile);
  };

  // Nova função: Cria o admin com o usuário e a senha que você digitou na tela
  const handleCreateAdmin = async () => {
    if (!username || !password) {
      return setError('Preencha os campos "Usuário" e "Senha" acima com os dados que você deseja usar.');
    }
    
    // O Supabase exige senhas de no mínimo 6 caracteres
    if (password.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    setError('');
    
    const fakeEmail = `${username}@ironforge.app`;
    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: password,
      options: {
        data: { username: username, role: 'admin', name: 'Instrutor Principal', needs_password_change: false }
      }
    });
    
    setLoading(false);

    if (signUpError) {
      setError('Erro no setup: ' + signUpError.message);
    } else {
      alert('Instrutor criado com SUCESSO com a sua senha! Agora é só clicar no botão azul "Entrar".');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="bg-[#1E1E1E] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800">
        <div className="flex justify-center mb-6 text-[#009C9A]">
          <Dumbbell size={48} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-8 tracking-tight text-white">Acesso ao Treino</h1>
        {error && <p className="text-[#9C0100] text-sm text-center mb-4 bg-red-900/20 py-2 rounded-lg px-2">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">Usuário</label>
            <input 
              type="text" 
              className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#005A9C] transition-colors"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#005A9C] transition-colors"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#005A9C] hover:bg-[#009C9A] text-white font-bold py-3 rounded-xl transition-all duration-300 mt-4 shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
        
        <button 
          type="button" 
          onClick={handleCreateAdmin} 
          className="w-full mt-6 bg-[#121212] border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:text-white hover:border-gray-500 transition-colors"
        >
          🛠️ Setup Inicial: Criar Instrutor
        </button>
      </div>
    </div>
  );
}