// Utilitários para gerenciar LocalStorage do IT Ghost

const STORAGE_KEYS = {
  REGISTROS: 'itghost_registros',
  USUARIOS: 'itghost_usuarios',
  SESSAO: 'itghost_sessao',
} as const;

// ============= REGISTROS =============

export const salvarRegistros = (registros: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTROS, JSON.stringify(registros));
  } catch (error) {
    console.error('Erro ao salvar registros:', error);
    throw new Error('Não foi possível salvar os registros');
  }
};

export const carregarRegistros = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTROS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar registros:', error);
    return [];
  }
};

export const adicionarRegistro = (registro: any): void => {
  const registros = carregarRegistros();
  registros.push(registro);
  salvarRegistros(registros);
};

export const atualizarRegistro = (id: string, dadosAtualizados: Partial<any>): void => {
  const registros = carregarRegistros();
  const index = registros.findIndex(r => r.id === id);

  if (index !== -1) {
    registros[index] = {
      ...registros[index],
      ...dadosAtualizados,
      atualizadoEm: new Date().toISOString(),
    };
    salvarRegistros(registros);
  } else {
    throw new Error('Registro não encontrado');
  }
};

export const deletarRegistro = (id: string): void => {
  const registros = carregarRegistros();
  const novaLista = registros.filter(r => r.id !== id);
  salvarRegistros(novaLista);
};

export const buscarRegistroPorId = (id: string): any | null => {
  const registros = carregarRegistros();
  return registros.find(r => r.id === id) || null;
};

// ============= USUÁRIOS =============

export const salvarUsuarios = (usuarios: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
  } catch (error) {
    console.error('Erro ao salvar usuários:', error);
  }
};

export const carregarUsuarios = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    return [];
  }
};

export const buscarUsuarioPorUsername = (username: string): any | null => {
  const usuarios = carregarUsuarios();
  return usuarios.find(u => u.username === username) || null;
};

// ============= SESSÃO =============

export const salvarSessao = (usuario: any): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify({
      username: usuario.username,
      nomeCompleto: usuario.nomeCompleto,
      loginEm: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
  }
};

export const carregarSessao = (): any | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSAO);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar sessão:', error);
    return null;
  }
};

export const limparSessao = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSAO);
};

// ============= BACKUP E RESTORE =============

export const exportarDados = (): string => {
  const dados = {
    registros: carregarRegistros(),
    usuarios: carregarUsuarios(),
    exportadoEm: new Date().toISOString(),
  };
  return JSON.stringify(dados, null, 2);
};

export const importarDados = (jsonString: string): void => {
  try {
    const dados = JSON.parse(jsonString);

    if (dados.registros) {
      salvarRegistros(dados.registros);
    }

    if (dados.usuarios) {
      salvarUsuarios(dados.usuarios);
    }

    alert('Dados importados com sucesso!');
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    throw new Error('Arquivo de backup inválido');
  }
};

export const limparTodosDados = (): void => {
  if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita!')) {
    localStorage.removeItem(STORAGE_KEYS.REGISTROS);
    localStorage.removeItem(STORAGE_KEYS.USUARIOS);
    localStorage.removeItem(STORAGE_KEYS.SESSAO);
    alert('Todos os dados foram apagados');
  }
};
