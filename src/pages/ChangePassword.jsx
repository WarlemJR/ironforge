import React, { useState } from 'react';
import { Dumbbell, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ChangePassword({ user, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Regex: Pelo menos 8 caracteres e 1 caractere especial
  const passwordRegex = /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) return setError('As senhas não coincidem.');
    if (!passwordRegex.test(newPassword)) return setError('A senha deve ter no mínimo 8 caracteres e conter pelo menos 1 símbolo especial.');

    setLoading(true);

    // 1. Atualiza a senha no Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
    
    if (authError) {
      setLoading(false);
      return setError('Erro ao atualizar a senha. Tente novamente.');
    }

    // 2. Marca no perfil que a troca já foi feita
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ needs_password_change: false })
      .eq('id', user.id)
      .select()
      .single();

    setLoading(false);
    onPasswordChanged(updatedProfile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="bg-[#1E1E1E] p-8 rounded-xl shadow-2xl w-full max-w-md border border-[#9C0100]/30 shadow-[#9C0100]/10">
        <div className="flex justify-center mb-4 text-[#9C0100]">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 tracking-tight text-white">Atualização Obrigatória</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Olá, <strong>{user.name}</strong>! Este é seu primeiro acesso. Por segurança, defina uma nova senha.
        </p>
        
        {error && <p className="text-[#9C0100] text-sm text-center mb-4 bg-red-900/20 py-2 rounded-lg px-2">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">Nova Senha</label>
            <input 
              type="password" 
              className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#9C0100] transition-colors"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#9C0100] transition-colors"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#9C0100] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-300 mt-4 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Salvar e Acessar Treino'}
          </button>
        </form>
      </div>
    </div>
  );
}