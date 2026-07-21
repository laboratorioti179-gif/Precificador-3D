import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, RotateCcw, Box, Clock, Zap, Wrench, Package, Info, Calculator, Sun, Moon, CheckCircle, Plus, Trash2, Save, Mail, Lock, LogOut, ArrowRight, LockKeyhole, MessageCircle, RefreshCw, Camera, LayoutGrid } from 'lucide-react';

// Credenciais do Supabase
const supabaseUrl = 'https://yymcybqwtuvymzprudhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWN5YnF3dHV2eW16cHJ1ZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzY5MjQsImV4cCI6MjA5NzU1MjkyNH0.truQM_HQN-wLDX8yN2WJu6pAobNuqNGnh8-XQgsOm3Q';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.title = "PrintPrice 3D";

    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = darkMode ? "#020617" : "#f8fafc";
    document.head.appendChild(metaThemeColor);

    const metaAppleStatus = document.createElement('meta');
    metaAppleStatus.name = "apple-mobile-web-app-status-bar-style";
    metaAppleStatus.content = "black-translucent";
    document.head.appendChild(metaAppleStatus);

    const metaAppleCapable = document.createElement('meta');
    metaAppleCapable.name = "apple-mobile-web-app-capable";
    metaAppleCapable.content = "yes";
    document.head.appendChild(metaAppleCapable);
    
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/5968/5968322.png";
    const appleIconUrl = "https://cdn-icons-png.flaticon.com/512/5968/5968322.png";

    const linkFavicon = document.createElement('link');
    linkFavicon.rel = "icon";
    linkFavicon.href = iconUrl;
    linkFavicon.type = "image/png";
    document.head.appendChild(linkFavicon);

    const linkAppleTouch = document.createElement('link');
    linkAppleTouch.rel = "apple-touch-icon";
    linkAppleTouch.href = appleIconUrl;
    document.head.appendChild(linkAppleTouch);

    const manifest = {
      "name": "PrintPrice 3D",
      "short_name": "PrintPrice",
      "start_url": ".",
      "display": "standalone",
      "background_color": "#020617",
      "theme_color": "#2563eb",
      "icons": [
        { "src": iconUrl, "sizes": "192x192", "type": "image/png" },
        { "src": iconUrl, "sizes": "512x512", "type": "image/png" }
      ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    const linkManifest = document.createElement('link');
    linkManifest.rel = "manifest";
    linkManifest.href = manifestUrl;
    document.head.appendChild(linkManifest);

    return () => {
       document.head.removeChild(metaThemeColor);
       document.head.removeChild(metaAppleStatus);
       document.head.removeChild(metaAppleCapable);
       document.head.removeChild(linkFavicon);
       document.head.removeChild(linkAppleTouch);
       document.head.removeChild(linkManifest);
       URL.revokeObjectURL(manifestUrl);
    };
  }, []);

  const [formData, setFormData] = useState({
    nomePeca: '',
    nomeCliente: '',
    tempoImpressao: 18,
    potenciaImpressora: 120,
    valorKwh: 0.95,
    depreciacaoHora: 0.35,
    tempoMaoObra: 40,
    valorHoraMaoObra: 40,
    valorMateriaisExtras: 8.50,
    taxaManutencao: 10,
    taxaPerdas: 10,
    margemLucro: 100,
    foto: null,
    filamentos: [
      { id: '1', tipo: '', cor: '', peso: 180, valorKg: 120 }
    ]
  });

  const [activeTab, setActiveTab] = useState('calculator');
  const [savedProducts, setSavedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [results, setResults] = useState({
    custoFilamento: 0,
    custoEnergia: 0,
    consumoKwh: 0,
    custoMaoObra: 0,
    custoDepreciacao: 0,
    subtotal: 0,
    custoManutencao: 0,
    custoPerdas: 0,
    custoTotalReal: 0,
    precoVenda: 0,
    lucroLiquido: 0
  });

  const [isSaving, setIsSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Status da Assinatura: 'loading', 'active', 'inactive', 'expired'
  const [subStatus, setSubStatus] = useState('loading');
  const [subExpirationDate, setSubExpirationDate] = useState(null);

  const pdfTemplateRef = useRef(null);

  // Derivações do filamento
  const pesoTotal = formData.filamentos.reduce((acc, f) => acc + (Number(f.peso) || 0), 0);
  const detalhesFilamentos = formData.filamentos.map(f => {
    const partes = [];
    if (f.tipo) partes.push(f.tipo);
    if (f.cor) partes.push(f.cor);
    const nome = partes.length > 0 ? partes.join(' ') : 'Filamento';
    return `${nome} (${f.peso}g)`;
  }).join(', ');

  useEffect(() => {
    const custoFilamento = formData.filamentos.reduce((acc, f) => {
      const pesoKg = (Number(f.peso) || 0) / 1000;
      const valor = Number(f.valorKg) || 0;
      return acc + (pesoKg * valor);
    }, 0);

    const tempoHoras = Number(formData.tempoImpressao) || 0;
    const potencia = Number(formData.potenciaImpressora) || 0;
    const valorKwh = Number(formData.valorKwh) || 0;
    const consumoKwh = (potencia * tempoHoras) / 1000;
    const custoEnergia = consumoKwh * valorKwh;

    const tempoMaoObraMin = Number(formData.tempoMaoObra) || 0;
    const valorHoraMaoObra = Number(formData.valorHoraMaoObra) || 0;
    const horasTrabalhadas = tempoMaoObraMin / 60;
    const custoMaoObra = horasTrabalhadas * valorHoraMaoObra;

    const materiaisExtras = Number(formData.valorMateriaisExtras) || 0;
    const depreciacaoHora = Number(formData.depreciacaoHora) || 0;
    const custoDepreciacao = tempoHoras * depreciacaoHora;

    const subtotal = custoFilamento + custoEnergia + custoMaoObra + materiaisExtras + custoDepreciacao;

    const pctManutencao = Number(formData.taxaManutencao) || 0;
    const custoManutencao = subtotal * (pctManutencao / 100);

    const pctPerdas = Number(formData.taxaPerdas) || 0;
    const custoPerdas = subtotal * (pctPerdas / 100);

    const custoTotalReal = subtotal + custoManutencao + custoPerdas;

    const pctLucro = Number(formData.margemLucro) || 0;
    const precoVenda = custoTotalReal * (1 + (pctLucro / 100));
    const lucroLiquido = precoVenda - custoTotalReal;

    setResults({
      custoFilamento,
      custoEnergia,
      consumoKwh,
      custoMaoObra,
      custoDepreciacao,
      subtotal,
      custoManutencao,
      custoPerdas,
      custoTotalReal,
      precoVenda,
      lucroLiquido
    });
  }, [formData]);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = darkMode ? "#020617" : "#f8fafc";
    }
  }, [darkMode]);

  const handleFilamentoChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      filamentos: prev.filamentos.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const addFilamento = () => {
    setFormData(prev => ({
      ...prev,
      filamentos: [...prev.filamentos, { id: Date.now().toString(), tipo: '', cor: '', peso: 0, valorKg: 120 }]
    }));
  };

  const removeFilamento = (id) => {
    setFormData(prev => {
      if (prev.filamentos.length <= 1) return prev;
      return { ...prev, filamentos: prev.filamentos.filter(f => f.id !== id) };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      nomePeca: '', nomeCliente: '', tempoImpressao: 18, potenciaImpressora: 120, valorKwh: 0.95,
      depreciacaoHora: 0.35, tempoMaoObra: 40, valorHoraMaoObra: 40, valorMateriaisExtras: 8.50,
      taxaManutencao: 10, taxaPerdas: 10, margemLucro: 100, foto: null,
      filamentos: [{ id: '1', tipo: '', cor: '', peso: 180, valorKg: 120 }]
    });
    showToast('Formulário resetado');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar a imagem para não pesar no banco de dados (max 600px)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
           scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Converte para Base64 (compressão JPEG 70%)
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, foto: base64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orcamentos?select=*&order=criado_em.desc`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      const data = await response.json();
      
      // Filtra apenas os produtos do usuário logado
      const myProducts = data.filter(item => item.dados_formulario?.usuario_email === user?.email);
      setSavedProducts(myProducts);
    } catch (error) {
      showToast('Erro ao carregar produtos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      // Forçamos o retorno (return=representation) para garantir que a linha foi afetada
      const response = await fetch(`${supabaseUrl}/rest/v1/orcamentos?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${sessionToken}`,
          'Prefer': 'return=representation'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha no banco de dados');
      }
      
      const responseData = await response.json();
      
      // Se o banco retornar um array vazio, significa que a segurança bloqueou a exclusão
      if (responseData.length === 0) {
          throw new Error('Bloqueado pelo Supabase. Rode o comando SQL de DELETE.');
      }

      showToast('Produto excluído');
      
      // Atualiza a lista localmente SOMENTE se a exclusão no banco foi um sucesso
      setSavedProducts(prev => prev.filter(produto => produto.id !== id));
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Erro ao excluir produto');
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const formatBRL = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const checkSubscription = async (userEmail, token) => {
    setSubStatus('loading');
    
    if (!userEmail) {
      setSubStatus('inactive');
      return;
    }

    try {
      // Correção: Usando a supabaseKey no Authorization e removendo espaços vazios do email
      const response = await fetch(`${supabaseUrl}/rest/v1/assinaturas?email=eq.${encodeURIComponent(userEmail.trim())}&select=data_validade`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.hint || `Erro de permissão no Supabase (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const validade = new Date(data[0].data_validade);
        setSubExpirationDate(validade);
        
        if (validade > new Date()) {
          setSubStatus('active');
          showToast('Acesso validado!');
        } else {
          setSubStatus('expired');
          showToast(`Expirada em: ${validade.toLocaleDateString('pt-BR')}`);
        }
      } else {
        setSubStatus('inactive');
        showToast('Pagamento não localizado no banco.');
      }
    } catch (error) {
      console.error("Erro na verificação de assinatura:", error);
      setSubStatus('inactive'); 
      showToast(error.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Preencha e-mail e senha'); return;
    }
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/v1/token?grant_type=password' : '/auth/v1/signup';
      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error_description || data.msg || 'Erro na autenticação');

      if (authMode === 'register' && data.user && !data.session && !data.access_token) {
         showToast('Conta criada! Faça login agora.');
         setAuthMode('login');
      } else if (data.session || data.access_token) {
         const loggedUser = data.user || data.session?.user;
         const token = data.access_token || data.session?.access_token;
         
         setUser(loggedUser);
         setSessionToken(token);
         showToast('Login realizado com sucesso!');
         
         // Após o login, verifica se ele pagou
         checkSubscription(loggedUser?.email, token);
      }
    } catch (error) {
      console.error(error);
      if (error.message.includes('Invalid login credentials')) showToast('E-mail ou senha incorretos.');
      else if (error.message.includes('already registered')) showToast('Este e-mail já está cadastrado.');
      else showToast(error.message || 'Erro ao autenticar');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSessionToken(null);
    setSubStatus('loading');
    setEmail('');
    setPassword('');
    showToast('Você saiu do sistema');
  };

  const handleCopy = () => {
    const nome = formData.nomePeca || 'Projeto 3D';
    const cliente = formData.nomeCliente ? ` (Cliente: ${formData.nomeCliente})` : '';
    const orcamentoTexto = `Orçamento: ${nome}${cliente}\n----------------------------------\nCusto Base: ${formatBRL(results.custoTotalReal)}\nLucro Aplicado: ${formData.margemLucro}%\n\nPREÇO FINAL SUGERIDO: ${formatBRL(results.precoVenda)}\n----------------------------------\nDetalhes do Projeto:\n- Peso estimado: ${pesoTotal}g\n- Tempo de impressão: ${formData.tempoImpressao}h\n- Materiais: ${detalhesFilamentos}`;
    
    navigator.clipboard.writeText(orcamentoTexto)
      .then(() => showToast('Copiado com sucesso!'))
      .catch(() => showToast('Erro ao copiar'));
  };

  const handlePdf = () => {
    showToast('Gerando PDF...');
    const dateElement = document.getElementById('pdf-date-text');
    if (dateElement) dateElement.innerText = `Data de emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;

    if (typeof window.html2pdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = generatePdfAction;
      document.body.appendChild(script);
    } else {
      generatePdfAction();
    }
  };

  const generatePdfAction = () => {
    const element = pdfTemplateRef.current;
    let nomeArquivo = 'Orcamento_Impressao_3D';
    if(formData.nomeCliente) nomeArquivo += `_${formData.nomeCliente.replace(/\s+/g, '_')}`;
    nomeArquivo += '.pdf';

    const opt = { margin: 0.4, filename: nomeArquivo, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save().then(() => showToast("PDF gerado!")).catch(() => showToast("Erro ao gerar PDF."));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${sessionToken}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          cliente: formData.nomeCliente || 'Não informado', peca: formData.nomePeca || 'Projeto 3D',
          preco_venda: results.precoVenda, custo_real: results.custoTotalReal, lucro_liquido: results.lucroLiquido,
          dados_formulario: { ...formData, usuario_email: user?.email }
        })
      });
      if (!response.ok) throw new Error('Erro na requisição: ' + response.statusText);
      showToast('Salvo');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar. Verifique se a tabela existe.');
    } finally {
      setIsSaving(false);
    }
  };

  // Setup generic classes for UI
  const labelClass = `block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`;
  const inputClass = `w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all duration-200 
    ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm'}`;
  const compactInputClass = `w-full px-3 py-1.5 text-sm rounded-lg border focus:ring-2 outline-none transition-all duration-200 
    ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm'}`;
  const cardClass = `rounded-xl p-6 ${darkMode ? 'bg-slate-900 border border-slate-800 shadow-xl' : 'bg-white border border-slate-100 shadow-md'}`;
  const sectionTitleClass = `text-lg font-semibold mb-4 flex items-center gap-2 pb-2 border-b ${darkMode ? 'text-slate-100 border-slate-800' : 'text-slate-800 border-slate-100'}`;

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 text-white p-4 rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
              <Box size={36} />
            </div>
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>PrintPrice 3D</h1>
            <p className="text-sm opacity-70 mt-2">
              {authMode === 'login' ? 'Faça login para acessar o sistema' : 'Crie sua conta para começar'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className={labelClass}>E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClass} required />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={authLoading} className={`w-full py-3 mt-4 rounded-xl flex justify-center items-center gap-2 font-semibold text-white transition-all shadow-lg ${authLoading ? 'bg-blue-500/70 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}>
              {authLoading ? 'Aguarde...' : (authMode === 'login' ? 'Entrar no Sistema' : 'Criar Minha Conta')}
              {!authLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center border-t pt-6 border-slate-200 dark:border-slate-800">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm text-blue-500 hover:text-blue-400 transition-colors font-medium">
              {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Fazer login'}
            </button>
          </div>
        </div>

        <div className={`fixed bottom-5 right-5 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl transition-all duration-300 transform z-50 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <CheckCircle size={20} />
          <span className="font-medium">{toastMessage}</span>
        </div>
      </div>
    );
  }

  if (subStatus === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin text-blue-500"><RefreshCw size={40} /></div>
      </div>
    );
  }

  if (subStatus !== 'active') {
    const zapText = encodeURIComponent("Eu quero precificar minhas impressões com o PrintPrice 3D por 19,90");
    const whatsappLink = `https://wa.me/5511988241182?text=${zapText}`;

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border text-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-center mb-6">
            <div className={`p-5 rounded-full ${darkMode ? 'bg-red-500/10 text-red-500' : 'bg-red-100 text-red-600'}`}>
              <LockKeyhole size={48} />
            </div>
          </div>
          
          <h1 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {subStatus === 'expired' ? 'Assinatura Expirada' : 'Acesso Restrito'}
          </h1>
          
          <p className="mb-6 opacity-80 leading-relaxed">
            {subStatus === 'expired' 
              ? <>O período da sua assinatura terminou no dia <strong className="text-red-500">{subExpirationDate ? subExpirationDate.toLocaleDateString('pt-BR') : ''}</strong>. Para continuar precificando suas peças com precisão, renove seu acesso.</>
              : 'Sua conta ainda não possui uma assinatura ativa. Para começar a lucrar mais com suas impressões 3D, libere seu acesso agora!'}
          </p>

          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 mb-4 rounded-xl flex justify-center items-center gap-2 font-bold text-white transition-all shadow-lg bg-[#25D366] hover:bg-[#1ebd5a] hover:shadow-green-500/30">
            <MessageCircle size={22} />
            Chamar no WhatsApp
          </a>

          <div className="flex flex-col gap-3 mt-6 border-t pt-6 border-slate-200 dark:border-slate-800">
            <button onClick={() => checkSubscription(user.email, sessionToken)} className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center justify-center gap-1.5">
              <RefreshCw size={16} /> Já paguei / Atualizar Acesso
            </button>
            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-500 font-medium flex items-center justify-center gap-1.5 mt-2">
              <LogOut size={16} /> Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><Box size={20} /></div>
            <span className={`font-bold text-xl tracking-tight hidden sm:block ${darkMode ? 'text-white' : 'text-slate-900'}`}>PrintPrice 3D</span>
          </div>

          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
            <button onClick={() => setActiveTab('calculator')} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <Calculator size={16} /> <span className="hidden sm:inline">Calculadora</span>
            </button>
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <LayoutGrid size={16} /> <span className="hidden sm:inline">Produtos</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mr-2 border ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
              <CheckCircle size={14} /> Assinatura Ativa
            </div>
            {activeTab === 'calculator' && (
              <button onClick={handleReset} className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-500`}>
                <RotateCcw size={16} /> <span className="hidden lg:inline">Limpar</span>
              </button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium transition-colors text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg">
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'calculator' ? (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* COLUNA ESQUERDA DA CALCULADORA */}
            <div className="w-full lg:w-2/3 space-y-6">
              
              <div className={cardClass}>
                <h2 className={sectionTitleClass}><Info className="text-blue-500" size={20} /> Dados do Projeto</h2>
                
                <div className="mb-6 flex flex-col sm:flex-row gap-5 items-start">
                  <div className={`shrink-0 w-32 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group transition-colors ${darkMode ? 'border-slate-700 bg-slate-800/50 hover:border-slate-500' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                    {formData.foto ? (
                      <>
                        <img src={formData.foto} alt="Produto" className="w-full h-full object-cover" />
                        <button onClick={() => setFormData(prev => ({...prev, foto: null}))} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Camera size={28} className="text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 font-medium text-center px-2">Adicionar<br/>Foto</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nome da Peça / Projeto</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Box size={16} className="text-slate-400" /></div>
                        <input type="text" name="nomePeca" value={formData.nomePeca} onChange={handleChange} placeholder="Ex: Action Figure Batman" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Cliente</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Info size={16} className="text-slate-400" /></div>
                        <input type="text" name="nomeCliente" value={formData.nomeCliente} onChange={handleChange} placeholder="Ex: João Silva" className={inputClass} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Tempo de Impressão (horas)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock size={16} className="text-slate-400" /></div>
                        <input type="number" name="tempoImpressao" value={formData.tempoImpressao} onChange={handleChange} min="0" step="0.5" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <div className={`flex items-center justify-between mb-4 border-b pb-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <Package className="text-blue-500" size={20} /> Materiais (Filamentos)
                  </h2>
                  <button onClick={addFilamento} className="flex items-center gap-1 text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                <div 
                  className={`space-y-4 max-h-[320px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:rounded-lg ${darkMode ? '[&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500' : '[&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400'}`}
                  style={{ scrollbarWidth: 'thin', scrollbarColor: darkMode ? '#475569 transparent' : '#cbd5e1 transparent' }}
                >
                  {formData.filamentos.map((filamento) => (
                    <div key={filamento.id} className={`p-4 rounded-lg border relative ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'}`}>
                      {formData.filamentos.length > 1 && (
                        <button onClick={() => removeFilamento(filamento.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors" title="Remover Filamento">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tipo (PLA, ABS)</label>
                          <input type="text" value={filamento.tipo} onChange={e => handleFilamentoChange(filamento.id, 'tipo', e.target.value)} placeholder="Ex: PLA" className={compactInputClass} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cor</label>
                          <input type="text" value={filamento.cor} onChange={e => handleFilamentoChange(filamento.id, 'cor', e.target.value)} placeholder="Ex: Preto" className={compactInputClass} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Peso (g)</label>
                          <input type="number" value={filamento.peso} onChange={e => handleFilamentoChange(filamento.id, 'peso', e.target.value)} min="0" className={compactInputClass} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Valor Kg (R$)</label>
                          <input type="number" value={filamento.valorKg} onChange={e => handleFilamentoChange(filamento.id, 'valorKg', e.target.value)} min="0" step="0.1" className={compactInputClass} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitleClass}><Zap className="text-blue-500" size={20} /> Energia & Máquina</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className={labelClass}>Consumo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">W</div>
                      <input type="number" name="potenciaImpressora" value={formData.potenciaImpressora} onChange={handleChange} min="0" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Valor kWh</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">R$</div>
                      <input type="number" name="valorKwh" value={formData.valorKwh} onChange={handleChange} min="0" step="0.01" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass} title="Custo da máquina dividido pela vida útil">Depreciação/Hora</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">R$</div>
                    <input type="number" name="depreciacaoHora" value={formData.depreciacaoHora} onChange={handleChange} min="0" step="0.01" className={inputClass} />
                  </div>
                  <p className="text-xs mt-1 text-slate-500">Ex: R$2.800 ÷ 8.000h = R$0,35/h</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={cardClass}>
                  <h2 className={sectionTitleClass}><Wrench className="text-blue-500" size={20} /> Mão de Obra (Pós)</h2>
                  <p className="text-xs mb-3 text-slate-500">Remover suportes, lixar, pintar...</p>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Tempo Gasto (minutos)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock size={16} className="text-slate-400" /></div>
                        <input type="number" name="tempoMaoObra" value={formData.tempoMaoObra} onChange={handleChange} min="0" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Valor da sua Hora</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">R$</div>
                        <input type="number" name="valorHoraMaoObra" value={formData.valorHoraMaoObra} onChange={handleChange} min="0" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cardClass}>
                  <h2 className={sectionTitleClass}><Package className="text-blue-500" size={20} /> Materiais Extras</h2>
                  <p className="text-xs mb-3 text-slate-500">Cola, tinta, ímãs, embalagem...</p>
                  <div>
                    <label className={labelClass}>Valor Total Extra</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">R$</div>
                      <input type="number" name="valorMateriaisExtras" value={formData.valorMateriaisExtras} onChange={handleChange} min="0" step="0.1" className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={cardClass}>
                <h2 className={sectionTitleClass}><Calculator className="text-blue-500" size={20} /> Taxas & Margem de Lucro</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Manutenção (%)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold">%</div>
                      <input type="number" name="taxaManutencao" value={formData.taxaManutencao} onChange={handleChange} min="0" max="100" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Perdas (%)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold">%</div>
                      <input type="number" name="taxaPerdas" value={formData.taxaPerdas} onChange={handleChange} min="0" max="100" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={`${labelClass} !text-blue-500 font-bold`}>Margem Lucro (%)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold text-blue-500">%</div>
                      <input type="number" name="margemLucro" value={formData.margemLucro} onChange={handleChange} min="0" 
                        className={`${inputClass} border-blue-500/50 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* FIM DA COLUNA ESQUERDA DA CALCULADORA */}

            {/* COLUNA DIREITA DA CALCULADORA (RESUMO) */}
            <div className="w-full lg:w-1/3">
              <div className={`sticky top-24 rounded-xl border-t-4 border-t-blue-500 overflow-hidden shadow-2xl relative p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="absolute -right-8 -top-8 text-blue-500/10 pointer-events-none transform rotate-12">
                  <Calculator size={140} />
                </div>
                
                <div className="relative z-10">
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Resumo de Custos</h2>
                  
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between border-b border-dashed pb-2 border-slate-500/30">
                      <span>Filamento</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(results.custoFilamento)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-2 border-slate-500/30">
                      <span>Energia <span className="text-xs opacity-60">({results.consumoKwh.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})} kWh)</span></span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(results.custoEnergia)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-2 border-slate-500/30">
                      <span>Mão de Obra</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(results.custoMaoObra)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-2 border-slate-500/30">
                      <span>Extras</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(formData.valorMateriaisExtras)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed pb-2 border-slate-500/30">
                      <span>Depreciação (Máq.)</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(results.custoDepreciacao)}</span>
                    </div>
                    
                    <div className="pt-2"></div>
                    
                    <div className="flex justify-between text-xs opacity-70">
                      <span>Subtotal</span>
                      <span>{formatBRL(results.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-orange-500">
                      <span>Manutenção</span>
                      <span>{formatBRL(results.custoManutencao)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Perdas</span>
                      <span>{formatBRL(results.custoPerdas)}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg mb-4 border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-sm mb-1 opacity-70">Custo Real (Base)</p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBRL(results.custoTotalReal)}</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-semibold text-blue-500">Preço Sugerido</p>
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold">+{formData.margemLucro}% Lucro</span>
                    </div>
                    <p className="text-4xl font-black text-blue-500">{formatBRL(results.precoVenda)}</p>
                    <p className="text-xs mt-2 opacity-70">
                      Lucro líquido: <span className="font-bold text-emerald-500">{formatBRL(results.lucroLiquido)}</span>
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <button onClick={handleSave} disabled={isSaving} className={`w-full py-2.5 mb-3 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar no Banco'}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleCopy} className={`w-full py-2.5 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors border
                        ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'}`}>
                        <Copy size={18} /> Copiar
                      </button>
                      <button onClick={handlePdf} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors">
                        <Download size={18} /> Gerar PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* FIM DA COLUNA DIREITA DA CALCULADORA */}
            
          </div> 
        ) : (
          /* ABA DE PRODUTOS SALVOS */
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Meus Produtos</h1>
                <p className="text-sm opacity-70 mt-1">Histórico de precificações salvas na nuvem.</p>
              </div>
              <button onClick={fetchProducts} className="flex items-center gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-4 py-2 rounded-lg font-medium transition-colors">
                <RefreshCw size={18} className={loadingProducts ? 'animate-spin' : ''} /> 
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-20">
                <RefreshCw size={40} className="animate-spin text-blue-500 opacity-50" />
              </div>
            ) : savedProducts.length === 0 ? (
              <div className={`text-center py-24 rounded-xl border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-300 bg-white'}`}>
                <Package size={60} className="mx-auto text-slate-400 mb-4 opacity-30" />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Nenhum produto salvo</h3>
                <p className="opacity-70 mt-2 max-w-sm mx-auto mb-6">Vá para a aba Calculadora, crie um orçamento e clique em "Salvar no Banco" para visualizar aqui.</p>
                <button onClick={() => setActiveTab('calculator')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto">
                  <Calculator size={18} /> Criar Precificação
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedProducts.map((produto) => {
                  const dataCriacao = new Date(produto.criado_em).toLocaleDateString('pt-BR');
                  const foto = produto.dados_formulario?.foto;
                  const tempoH = produto.dados_formulario?.tempoImpressao;
                  
                  return (
                    <div key={produto.id} className={`rounded-xl overflow-hidden border group transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <div className={`h-48 w-full relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${!foto && 'border-b border-slate-200 dark:border-slate-800'}`}>
                        {foto ? (
                          <img src={foto} alt={produto.peca} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <Box size={48} className="text-slate-400 opacity-20" />
                        )}
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-2 py-1 rounded">
                          {dataCriacao}
                        </div>
                        <button onClick={() => handleDeleteProduct(produto.id)} className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-105" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="p-5">
                        <h3 className={`font-bold text-lg mb-1 truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} title={produto.peca}>
                          {produto.peca || 'Sem Nome'}
                        </h3>
                        <p className="text-sm opacity-70 flex items-center gap-1.5 mb-5 truncate">
                          <Info size={14} /> {produto.cliente || 'Sem Cliente'}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className={`p-3 rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs opacity-70 mb-1">Custo Real</p>
                            <p className="font-semibold">{formatBRL(produto.custo_real)}</p>
                          </div>
                          <div className={`p-3 rounded-lg border ${darkMode ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
                            <p className="text-xs text-blue-500 font-medium mb-1">Preço Venda</p>
                            <p className="font-bold text-blue-500">{formatBRL(produto.preco_venda)}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs opacity-70 pt-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                          <span className="flex items-center gap-1"><Clock size={12}/> {tempoH}h imp.</span>
                          <span className="flex items-center gap-1 text-emerald-500 font-medium"><Zap size={12}/> Lucro: {formatBRL(produto.lucro_liquido)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Template PDF Oculto (Fora da tela para não cortar) */}
      <div 
        ref={pdfTemplateRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '-9999px',
          background: 'white',
          color: '#1e293b',
          padding: '60px',
          fontFamily: 'sans-serif',
          width: '800px',
          minHeight: '800px'
        }}
      >
        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Orçamento
          </h1>
          <p style={{ margin: '10px 0 0 0', color: '#64748b', fontSize: '14px' }} id="pdf-date-text"></p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '30px', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 20px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#0f172a' }}>
            Detalhes do Projeto
          </h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '14px 0', width: '35%', color: '#64748b', fontWeight: '500' }}>Cliente:</td>
                <td style={{ padding: '14px 0', fontWeight: '600', color: '#0f172a' }}>{formData.nomeCliente || 'Não informado'}</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontWeight: '500' }}>Peça / Projeto:</td>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{formData.nomePeca || 'Não informado'}</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontWeight: '500' }}>Tempo de Impressão:</td>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{formData.tempoImpressao}h</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontWeight: '500' }}>Materiais (Filamentos):</td>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{detalhesFilamentos || 'Não informado'}</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontWeight: '500' }}>Peso Total Estimado:</td>
                <td style={{ padding: '14px 0', borderTop: '1px dashed #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{pesoTotal}g</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>Valor Total do Investimento</p>
          <p style={{ margin: '0', fontSize: '54px', fontWeight: '900', color: '#1e3a8a' }}>
            {formatBRL(results.precoVenda)}
          </p>
          <p style={{ margin: '20px 0 0 0', fontSize: '14px', color: '#3b82f6' }}>
            * Este orçamento tem validade de 15 dias a partir da data de emissão.
          </p>
        </div>
        
        <div style={{ marginTop: '100px', textAlign: 'center', fontSize: '14px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '25px' }}>
          <strong style={{ color: '#64748b' }}>PrintPrice 3D</strong><br/>
          Agradecemos a preferência!
        </div>
      </div>

      <div className={`fixed bottom-5 right-5 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl transition-all duration-300 transform z-50 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <CheckCircle size={20} />
        <span className="font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
