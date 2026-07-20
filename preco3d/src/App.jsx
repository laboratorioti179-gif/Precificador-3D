import React, { useState, useEffect, useRef } from 'react';
import { Download, Copy, RotateCcw, Box, Clock, Zap, Wrench, Package, Info, Calculator, Sun, Moon, CheckCircle } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  // Data State
  const [formData, setFormData] = useState({
    nomePeca: '',
    nomeCliente: '',
    pesoPeca: 180,
    tempoImpressao: 18,
    tipoFilamento: '',
    valorKgFilamento: 120,
    potenciaImpressora: 120,
    valorKwh: 0.95,
    depreciacaoHora: 0.35,
    tempoMaoObra: 40,
    valorHoraMaoObra: 40,
    valorMateriaisExtras: 8.50,
    taxaManutencao: 10,
    taxaPerdas: 10,
    margemLucro: 100
  });

  // Results State
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

  const pdfTemplateRef = useRef(null);

  // Auto-calculate whenever formData changes
  useEffect(() => {
    const peso = Number(formData.pesoPeca) || 0;
    const valorKg = Number(formData.valorKgFilamento) || 0;
    const custoFilamento = (peso / 1000) * valorKg;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      nomePeca: '',
      nomeCliente: '',
      pesoPeca: 180,
      tempoImpressao: 18,
      tipoFilamento: '',
      valorKgFilamento: 120,
      potenciaImpressora: 120,
      valorKwh: 0.95,
      depreciacaoHora: 0.35,
      tempoMaoObra: 40,
      valorHoraMaoObra: 40,
      valorMateriaisExtras: 8.50,
      taxaManutencao: 10,
      taxaPerdas: 10,
      margemLucro: 100
    });
    showToast('Formulário resetado');
  };

  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCopy = () => {
    const nome = formData.nomePeca || 'Projeto 3D';
    const cliente = formData.nomeCliente ? ` (Cliente: ${formData.nomeCliente})` : '';
    const orcamentoTexto = `Orçamento: ${nome}${cliente}
----------------------------------
Custo Base: ${formatBRL(results.custoTotalReal)}
Lucro Aplicado: ${formData.margemLucro}%

PREÇO FINAL SUGERIDO: ${formatBRL(results.precoVenda)}
----------------------------------
Detalhes do Projeto:
- Peso estimado: ${formData.pesoPeca}g
- Tempo de impressão: ${formData.tempoImpressao}h`;
    
    navigator.clipboard.writeText(orcamentoTexto)
      .then(() => showToast('Copiado com sucesso!'))
      .catch(() => showToast('Erro ao copiar'));
  };

  const handlePdf = () => {
    showToast('Gerando PDF...');
    
    // Dynamically load html2pdf if not present
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
    element.style.display = 'block'; // Make visible for capture
    
    let nomeArquivo = 'Orcamento_Impressao_3D';
    if(formData.nomeCliente) {
        nomeArquivo += `_${formData.nomeCliente.replace(/\s+/g, '_')}`;
    }
    nomeArquivo += '.pdf';

    const opt = {
        margin:       0,
        filename:     nomeArquivo,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none'; // Hide again
        showToast("PDF gerado!");
    }).catch(err => {
        console.error(err);
        element.style.display = 'none';
        showToast("Erro ao gerar PDF.");
    });
  };

  // Setup generic classes for inputs to keep JSX clean
  const labelClass = `block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`;
  const inputClass = `w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all duration-200 
    ${darkMode 
      ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/30' 
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm'}`;
  const cardClass = `rounded-xl p-6 ${darkMode ? 'bg-slate-900 border border-slate-800 shadow-xl' : 'bg-white border border-slate-100 shadow-md'}`;
  const sectionTitleClass = `text-lg font-semibold mb-4 flex items-center gap-2 pb-2 border-b ${darkMode ? 'text-slate-100 border-slate-800' : 'text-slate-800 border-slate-100'}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
      
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><Box size={20} /></div>
            <span className={`font-bold text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>PrintPrice 3D</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleReset} className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-500`}>
              <RotateCcw size={16} /> Limpar
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Form Area */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Project Data */}
            <div className={cardClass}>
              <h2 className={sectionTitleClass}><Info className="text-blue-500" size={20} /> Dados do Projeto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className={labelClass}>Peso da Peça (gramas)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">g</div>
                    <input type="number" name="pesoPeca" value={formData.pesoPeca} onChange={handleChange} min="0" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tempo de Impressão (horas)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock size={16} className="text-slate-400" /></div>
                    <input type="number" name="tempoImpressao" value={formData.tempoImpressao} onChange={handleChange} min="0" step="0.5" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Material & Energy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={cardClass}>
                <h2 className={sectionTitleClass}><Package className="text-blue-500" size={20} /> Filamento</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Tipo/Cor (Opcional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Info size={16} className="text-slate-400" /></div>
                      <input type="text" name="tipoFilamento" value={formData.tipoFilamento} onChange={handleChange} placeholder="Ex: PLA Preto" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Valor do Kg (R$)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-bold">R$</div>
                      <input type="number" name="valorKgFilamento" value={formData.valorKgFilamento} onChange={handleChange} min="0" step="0.1" className={inputClass} />
                    </div>
                  </div>
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
                <p className="text-xs mb-3 text-slate-500">Soma: Cola, tinta, primer, embalagem...</p>
                <div className="mt-8">
                  <label className={labelClass}>Valor Total de Extras</label>
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

          {/* Results Area */}
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
                
                <div className="grid grid-cols-2 gap-3 mt-6">
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
      </main>

      {/* Hidden PDF Template (Focused on Client) */}
      <div style={{ display: 'none' }}>
        <div ref={pdfTemplateRef} style={{ background: 'white', color: '#0f172a', padding: '50px', fontFamily: 'sans-serif', width: '800px', minHeight: '800px' }}>
          
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>Proposta Comercial</h1>
            <p style={{ margin: '10px 0 0 0', color: '#64748b', fontSize: '14px' }}>Data de emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>

          <div style={{ marginBottom: '40px', fontSize: '16px', lineHeight: '1.6', color: '#334155' }}>
            <p style={{ marginBottom: '10px' }}>Olá <strong style={{ color: '#0f172a' }}>{formData.nomeCliente || 'Cliente'}</strong>,</p>
            <p style={{ margin: '0' }}>Agradecemos o seu interesse em nossos serviços de impressão 3D. Conforme solicitado, apresentamos abaixo o orçamento detalhado para a produção do seu projeto com o máximo de qualidade e precisão.</p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '25px', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 15px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>Detalhes do Projeto</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0', width: '30%', color: '#64748b', fontWeight: '500' }}>Peça / Projeto:</td>
                  <td style={{ padding: '12px 0', fontWeight: '600', color: '#0f172a' }}>{formData.nomePeca || 'Não informado'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', borderTop: '1px dashed #e2e8f0', color: '#64748b', fontWeight: '500' }}>Material Sugerido:</td>
                  <td style={{ padding: '12px 0', borderTop: '1px dashed #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{formData.tipoFilamento || 'Padrão / Não informado'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '35px', textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>Valor Total do Investimento</p>
            <p style={{ margin: '0', fontSize: '48px', fontWeight: '900', color: '#1e3a8a' }}>{formatBRL(results.precoVenda)}</p>
            <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#3b82f6' }}>* Este orçamento tem validade de 15 dias a partir da data de emissão.</p>
          </div>
          
          <div style={{ marginTop: '80px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <strong>PrintPrice 3D</strong><br/>
            Agradecemos a preferência!
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-5 right-5 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl transition-all duration-300 transform 
        ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <CheckCircle size={20} />
        <span className="font-medium">{toastMessage}</span>
      </div>

    </div>
  );
}