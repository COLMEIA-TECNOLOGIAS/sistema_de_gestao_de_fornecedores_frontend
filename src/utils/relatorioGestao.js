/**
 * Exportação do Relatório de Gestão de Pequenas Aquisições.
 *
 * O backend devolve só os dados; a geração dos ficheiros é feita aqui, nos
 * formatos que o documento pede:
 *   PDF   -> impressão e envio   (jspdf + autotable)
 *   DOCX  -> edição              (docx)
 *   XLSX  -> análise de dados    (write-excel-file)
 *   CSV   -> alternativa simples, aberta por qualquer folha de cálculo
 *
 * Valores monetários: o backend continua a enviá-los, mas o relatório NÃO os
 * mostra nem exporta — não há base de cálculo fiável para eles. É por isso que
 * colunasVisiveis() filtra `total_amount` num só sítio, em vez de cada formato
 * decidir por si.
 */

const LOGO_URL = '/login1.svg';

export const formatDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = String(iso).split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(iso);
};

/** Colunas que o relatório mostra, já sem as de valor. */
export const colunasVisiveis = (columns = {}) =>
    Object.entries(columns).filter(([chave]) => chave !== 'total_amount');

/** Valor de uma célula da tabela de detalhe, pela chave da coluna. */
export const cellValue = (row, key) => {
    switch (key) {
        case 'code': return row.code || '—';
        case 'description': return row.description || '—';
        case 'supplier': return row.supplier || '—';
        case 'approved_at': return formatDate(row.approved_at);
        case 'execution_period': return row.execution_period || '—';
        case 'work_location': return row.work_location || '—';
        case 'status': return row.status_label || row.status || '—';
        default: return row[key] ?? '—';
    }
};

/**
 * Os dois signatários do documento.
 *
 * O primeiro é quem emite o relatório — o utilizador autenticado. O segundo fica
 * sempre em branco de propósito: é o responsável que homologa, pessoa diferente
 * de quem gera o ficheiro.
 */
export const signatarios = (signatario) => [
    {
        // Sem utilizador a linha fica em branco: nunca inventar um nome.
        nome: signatario?.nome || '',
        // O papel do utilizador tal como está no sistema (Administrador,
        // Técnico de Procurement...), e não o rótulo fixo do documento.
        funcao: signatario?.cargo || 'Técnico / Especialista em Aquisições',
    },
    {
        nome: '',
        funcao: 'Responsável / Coordenador — Aprovação / Homologação',
    },
];

/** Secções com linhas, pela ordem do documento. */
const secoesComLinhas = (report) =>
    Object.entries(report.categories || {}).filter(([, cat]) => (cat.rows || []).length > 0);

const CABECALHO_RESUMO = ['Categoria', 'N.º Concluídos', 'N.º Em Curso', 'N.º Em Atraso'];

const linhasResumo = (report) => {
    const linhas = (report.summary?.by_category || []).map((l) => [
        l.label,
        String(l.completed ?? 0),
        String(l.in_progress ?? 0),
        String(l.late ?? 0),
    ]);
    const t = report.summary?.total;
    if (t) {
        linhas.push(['TOTAL GLOBAL', String(t.completed ?? 0), String(t.in_progress ?? 0), String(t.late ?? 0)]);
    }
    return linhas;
};

/**
 * O desvio vem assinado (negativo = entregue antes do previsto). Mostrado em
 * cru, "-22 dias" não se lê — daí dizer-se por palavras de que lado está.
 * Vive aqui para o ecrã e as exportações não divergirem.
 */
export const formatarDesvio = (dias) => {
    if (dias === null || dias === undefined) return null;
    const n = Number(dias);
    if (n === 0) return 'no prazo';
    return n < 0 ? `${Math.abs(n)} dias adiantado` : `${n} dias de atraso`;
};

const indicadoresDesempenho = (report) => {
    const p = report.performance || {};
    return [
        ['Dias médios até à aprovação', String(p.deadlines?.avg_days_to_approval ?? '—')],
        ['Desvio médio na entrega', formatarDesvio(p.deadlines?.avg_delivery_deviation_days) ?? '—'],
        ['Entregas dentro do prazo', String(p.deadlines?.delivered_on_time ?? 0)],
        ['Entregas fora do prazo', String(p.deadlines?.delivered_late ?? 0)],
        ['Processos em atraso', String(p.attention_points?.late_processes ?? 0)],
        ['Processos cancelados', String(p.attention_points?.cancelled_processes ?? 0)],
        ['Processos sem adjudicação', String(p.attention_points?.without_award ?? 0)],
        ['Processos por classificar', String(p.attention_points?.unclassified_processes ?? 0)],
        ['Cobertura documental', p.traceability?.attachment_coverage_pct == null
            ? '—' : `${p.traceability.attachment_coverage_pct}%`],
    ];
};

const nomeFicheiro = (report, extensao) => {
    const periodo = (report.report?.period?.label || 'periodo')
        .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
    return `relatorio_gestao_${periodo}.${extensao}`;
};

const descarregar = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const emitidoPor = (signatario) => (signatario?.nome
    ? (signatario.cargo ? `${signatario.nome} (${signatario.cargo})` : signatario.nome)
    : null);

/**
 * Carrega o logótipo da plataforma como PNG, para os formatos que o embutem.
 * Devolve null se falhar — um relatório sem logótipo é melhor do que nenhum.
 */
async function carregarLogo(tamanho = 160) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = tamanho;
                canvas.height = tamanho;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, tamanho, tamanho);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = LOGO_URL;
    });
}

// ── PDF ──────────────────────────────────────────────────────
export async function exportarPDF(report, signatario = null) {
    // ~400 KB: só se carrega quando alguém exporta
    const [{ default: jsPDF }, { default: autoTable }, logo] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        carregarLogo(),
    ]);

    const doc = new jsPDF({ orientation: 'landscape' });
    const verde = [68, 177, 111];
    const escuro = [17, 24, 39];
    const largura = doc.internal.pageSize.width;

    // --- Cabeçalho com o logótipo da plataforma ---
    doc.setFillColor(...escuro);
    doc.rect(0, 0, largura, 30, 'F');

    const textoX = logo ? 40 : 14;
    if (logo) doc.addImage(logo, 'PNG', 14, 5, 20, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RELATÓRIO DE GESTÃO DE PEQUENAS AQUISIÇÕES', textoX, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`${report.report?.system || 'MOSAP3'} · Período de referência: ${report.report?.period?.label || '—'}`, textoX, 20);

    const emissor = emitidoPor(signatario);
    doc.text(
        `Emitido em ${new Date().toLocaleString('pt-AO')}${emissor ? ` por ${emissor}` : ''}`,
        largura - 14, 20, { align: 'right' },
    );

    let y = 40;

    // --- 1. Resumo executivo ---
    doc.setFontSize(12);
    doc.setTextColor(...escuro);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumo Executivo', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    y += 6;
    doc.text(`Foram processados ${report.summary?.total_processes ?? 0} processos de pequenas aquisições.`, 14, y);
    y += 3;

    const resumo = linhasResumo(report);
    autoTable(doc, {
        startY: y,
        head: [CABECALHO_RESUMO],
        body: resumo,
        theme: 'grid',
        headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (data) => {
            if (data.section === 'body' && data.row.index === resumo.length - 1) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
    });

    y = doc.lastAutoTable.finalY + 12;

    // --- 2. Detalhe por categoria ---
    doc.setFontSize(12);
    doc.setTextColor(...escuro);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Detalhamento das Aquisições por Categoria', 14, y);
    y += 8;

    for (const [, cat] of secoesComLinhas(report)) {
        const colunas = colunasVisiveis(cat.columns);

        if (y > doc.internal.pageSize.height - 50) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...escuro);
        doc.text(cat.label, 14, y);
        y += 4;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(doc.splitTextToSize(cat.description || '', largura - 28), 14, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [colunas.map(([, titulo]) => titulo)],
            body: (cat.rows || []).map((row) => colunas.map(([k]) => cellValue(row, k))),
            theme: 'striped',
            headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // --- 3. Análise de desempenho ---
    if (y > doc.internal.pageSize.height - 60) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...escuro);
    doc.text('3. Análise de Desempenho e Conformidade', 14, y);
    y += 3;

    autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: indicadoresDesempenho(report),
        theme: 'grid',
        headStyles: { fillColor: verde, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'right' } },
    });

    // --- Assinaturas / Validação ---
    y = doc.lastAutoTable.finalY + 16;

    // Mesma guarda das restantes secções: sem isto o bloco fica cortado no
    // fundo da folha.
    if (y > doc.internal.pageSize.height - 55) {
        doc.addPage();
        y = 24;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...escuro);
    doc.text('Assinaturas / Validação', 14, y);
    y += 18;

    const colunaLargura = (largura - 28) / 2;
    signatarios(signatario).forEach((assinante, i) => {
        const x = 14 + i * colunaLargura;

        doc.setDrawColor(120, 120, 120);
        doc.line(x, y, x + colunaLargura - 20, y);

        if (assinante.nome) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...escuro);
            doc.text(assinante.nome, x, y + 6);
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
            doc.splitTextToSize(assinante.funcao, colunaLargura - 20),
            x,
            y + (assinante.nome ? 12 : 6),
        );
    });

    const paginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `MOSAP3 — Página ${i} de ${paginas}`,
            largura / 2,
            doc.internal.pageSize.height - 8,
            { align: 'center' },
        );
    }

    doc.save(nomeFicheiro(report, 'pdf'));
}

// ── DOCX ─────────────────────────────────────────────────────

// Larguras relativas das colunas (em %) por tipo, para as tabelas de detalhe
// não ficarem todas com colunas iguais e a descrição espremida.
const PESO_COLUNA = {
    code: 14,
    description: 30,
    supplier: 20,
    approved_at: 13,
    execution_period: 18,
    work_location: 20,
    status: 13,
};

export async function exportarDocx(report, signatario = null) {
    const [docxLib, logo] = await Promise.all([import('docx'), carregarLogo(160)]);
    const {
        Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber,
        Table, TableRow, TableCell, WidthType, ImageRun, BorderStyle, ShadingType,
        VerticalAlign, PageOrientation, TableLayoutType, convertMillimetersToTwip,
    } = docxLib;

    const VERDE = '44B16F';
    const VERDE_ESCURO = '0F6631';
    const ESCURO = '111827';
    const CINZA = '6B7280';
    const CINZA_CLARO = 'F3F4F6';
    const BORDA = 'D1D5DB';

    const semBorda = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const bordaFina = { style: BorderStyle.SINGLE, size: 4, color: BORDA };
    const bordasTabela = {
        top: bordaFina, bottom: bordaFina, left: bordaFina, right: bordaFina,
        insideHorizontal: bordaFina, insideVertical: bordaFina,
    };
    const semBordas = {
        top: semBorda, bottom: semBorda, left: semBorda, right: semBorda,
        insideHorizontal: semBorda, insideVertical: semBorda,
    };

    const p = (texto, opts = {}) => new Paragraph({
        children: [new TextRun({ text: String(texto ?? ''), ...opts })],
        spacing: opts.spacing,
        alignment: opts.alignment,
    });

    const ALINHA = { center: AlignmentType.CENTER, right: AlignmentType.RIGHT, left: AlignmentType.LEFT };

    const celula = (conteudo, opts = {}) => new TableCell({
        children: Array.isArray(conteudo) ? conteudo : [conteudo],
        shading: opts.shading,
        width: opts.width,
        verticalAlign: opts.verticalAlign || VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        borders: opts.borders,
        columnSpan: opts.columnSpan,
    });

    /**
     * Tabela com cabeçalho verde, linhas alternadas e cabeçalho repetido por página.
     *
     * `alinhamentos` dá o alinhamento de cada coluna (números ao centro ficam
     * muito mais legíveis do que encostados à esquerda de colunas largas) e
     * `destacarUltima` marca a linha de totais.
     */
    const tabela = (cabecalhos, linhas, pesos = null, { alinhamentos = [], destacarUltima = false } = {}) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: bordasTabela,
        columnWidths: pesos || undefined,
        rows: [
            new TableRow({
                tableHeader: true,     // repete o cabeçalho em cada página
                children: cabecalhos.map((h, c) => celula(
                    p(h, { bold: true, color: 'FFFFFF', size: 19, alignment: ALINHA[alinhamentos[c]] }),
                    { shading: { type: ShadingType.CLEAR, fill: VERDE } },
                )),
            }),
            ...linhas.map((linha, i) => {
                const ehTotal = destacarUltima && i === linhas.length - 1;
                return new TableRow({
                    children: linha.map((c, col) => celula(
                        p(c ?? '—', { size: 19, bold: ehTotal, alignment: ALINHA[alinhamentos[col]] }),
                        ehTotal
                            ? { shading: { type: ShadingType.CLEAR, fill: 'E5E7EB' } }
                            // Linhas alternadas: muito mais legível em tabelas longas.
                            : (i % 2 === 1 ? { shading: { type: ShadingType.CLEAR, fill: CINZA_CLARO } } : {}),
                    )),
                });
            }),
        ],
    });

    /** Metadados em duas colunas, sem bordas — mais limpo do que parágrafos soltos. */
    const metadados = (pares) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [28, 72],
        borders: semBordas,
        rows: pares.map(([rotulo, valor]) => new TableRow({
            children: [
                celula(p(rotulo, { bold: true, color: CINZA, size: 19 }), { borders: semBordas }),
                celula(p(valor, { size: 19 }), { borders: semBordas }),
            ],
        })),
    });

    const titulo1 = (texto) => new Paragraph({
        children: [new TextRun({ text: texto, bold: true, size: 26, color: VERDE_ESCURO })],
        spacing: { before: 360, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: VERDE } },
    });

    const titulo2 = (texto) => new Paragraph({
        children: [new TextRun({ text: texto, bold: true, size: 22, color: ESCURO })],
        spacing: { before: 240, after: 100 },
    });

    const filhos = [];

    // ── Capa do relatório: logo + título em faixa ────────────
    const cabecalhoDoc = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [12, 88],
        borders: semBordas,
        rows: [new TableRow({
            children: [
                celula(
                    logo
                        ? new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new ImageRun({
                                type: 'png',
                                data: logo.split(',')[1],   // base64 sem o prefixo data:
                                transformation: { width: 52, height: 52 },
                            })],
                        })
                        : p(''),
                    { shading: { type: ShadingType.CLEAR, fill: ESCURO }, borders: semBordas },
                ),
                celula([
                    p('RELATÓRIO DE GESTÃO', { bold: true, size: 30, color: 'FFFFFF' }),
                    p('DE PEQUENAS AQUISIÇÕES', { bold: true, size: 30, color: VERDE }),
                    p(report.report?.period?.label || '—', { size: 20, color: 'D1D5DB' }),
                ], { shading: { type: ShadingType.CLEAR, fill: ESCURO }, borders: semBordas }),
            ],
        })],
    });
    filhos.push(cabecalhoDoc);

    // ── 1. Dados gerais ──────────────────────────────────────
    filhos.push(titulo1('1. Dados Gerais do Relatório'));
    const pares = [
        ['Período de Referência', report.report?.period?.label || '—'],
        ['Sistema de Gestão Utilizado', report.report?.system || 'SGF/MOSAP3'],
        ['Data de Emissão', new Date().toLocaleDateString('pt-AO')],
        ['Âmbito', report.report?.scope || '—'],
    ];
    const emissor = emitidoPor(signatario);
    if (emissor) pares.push(['Emitido por', emissor]);
    filhos.push(metadados(pares));

    // ── 2. Resumo executivo ──────────────────────────────────
    filhos.push(
        titulo1('2. Resumo Executivo'),
        p(`Durante o período em análise foram processados ${report.summary?.total_processes ?? 0} processos de pequenas aquisições, distribuídos pelas categorias abaixo.`,
            { size: 20, spacing: { after: 160 } }),
        tabela(CABECALHO_RESUMO, linhasResumo(report), [40, 20, 20, 20], {
            alinhamentos: ['left', 'center', 'center', 'center'],
            destacarUltima: true,
        }),
    );

    // ── 3. Detalhe por categoria ─────────────────────────────
    filhos.push(titulo1('3. Detalhamento das Aquisições por Categoria'));

    secoesComLinhas(report).forEach(([, cat], i) => {
        const colunas = colunasVisiveis(cat.columns);
        const pesos = colunas.map(([k]) => PESO_COLUNA[k] || 16);

        filhos.push(
            titulo2(`3.${i + 1}. Categoria: ${cat.label}`),
            p(cat.description || '', { italics: true, color: CINZA, size: 18, spacing: { after: 120 } }),
            p('Resumo Operacional: [a preencher]', { size: 19, spacing: { after: 140 } }),
            tabela(
                colunas.map(([, rotulo]) => rotulo),
                (cat.rows || []).map((row) => colunas.map(([k]) => cellValue(row, k))),
                pesos,
            ),
        );
    });

    // ── 4. Análise de desempenho ─────────────────────────────
    filhos.push(
        titulo1('4. Análise de Desempenho e Conformidade'),
        tabela(['Indicador', 'Valor'], indicadoresDesempenho(report), [70, 30], {
            alinhamentos: ['left', 'right'],
        }),
    );

    // ── Assinaturas, lado a lado ─────────────────────────────
    filhos.push(titulo1('Assinaturas / Validação'));

    const linhaAssinatura = { bottom: { style: BorderStyle.SINGLE, size: 6, color: '888888' } };
    filhos.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [50, 50],
        borders: semBordas,
        rows: [new TableRow({
            // Alinhadas ao topo: com alinhamento ao centro, o signatário com
            // nome (duas linhas) empurrava a sua linha de assinatura para baixo
            // e as duas deixavam de ficar à mesma altura.
            children: signatarios(signatario).map((assinante) => celula([
                new Paragraph({ text: '', spacing: { before: 480 }, border: linhaAssinatura }),
                ...(assinante.nome ? [p(assinante.nome, { bold: true, size: 20 })] : []),
                p(assinante.funcao, { size: 18, color: CINZA }),
            ], { borders: semBordas, verticalAlign: VerticalAlign.TOP })),
        })],
    }));

    const doc = new Document({
        creator: report.report?.system || 'MOSAP3',
        title: 'Relatório de Gestão de Pequenas Aquisições',
        styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
        sections: [{
            properties: {
                page: {
                    // As tabelas de detalhe têm 6 colunas: em retrato ficariam ilegíveis.
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: {
                        top: convertMillimetersToTwip(18),
                        bottom: convertMillimetersToTwip(18),
                        left: convertMillimetersToTwip(16),
                        right: convertMillimetersToTwip(16),
                    },
                },
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            children: ['MOSAP3 — Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                            size: 16,
                            color: CINZA,
                        })],
                    })],
                }),
            },
            children: filhos,
        }],
    });

    descarregar(await Packer.toBlob(doc), nomeFicheiro(report, 'docx'));
}

// ── XLSX ─────────────────────────────────────────────────────

// Larguras (em caracteres) por tipo de coluna, para o conteúdo não ficar cortado.
const LARGURA_COLUNA = {
    code: 20,
    description: 46,
    supplier: 30,
    approved_at: 18,
    execution_period: 26,
    work_location: 28,
    status: 16,
};

const VERDE = '#44B16F';
const CINZA_BORDA = '#D1D5DB';
const CINZA_FUNDO = '#F3F4F6';

const estiloBase = { borderColor: CINZA_BORDA, borderStyle: 'thin', fontFamily: 'Calibri', fontSize: 11 };
const estiloCabecalho = { ...estiloBase, fontWeight: 'bold', backgroundColor: VERDE, color: '#FFFFFF', align: 'left', alignVertical: 'center' };

export async function exportarXlsx(report, signatario = null) {
    // O pacote não tem entrada raiz: a build para o browser é um subcaminho.
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    const titulo = (texto, colunas, extra = {}) => [
        { value: texto, type: String, fontWeight: 'bold', fontSize: 14, color: '#FFFFFF', backgroundColor: VERDE, align: 'left', alignVertical: 'center', height: 26, columnSpan: colunas, ...extra },
        ...Array(colunas - 1).fill(null),
    ];

    const legenda = (texto, colunas) => [
        { value: texto, type: String, fontSize: 10, fontStyle: 'italic', color: '#6B7280', wrap: true, columnSpan: colunas, height: 30 },
        ...Array(colunas - 1).fill(null),
    ];

    const parMetadados = (rotulo, valor) => [
        { value: rotulo, type: String, fontWeight: 'bold', fontSize: 10, color: '#6B7280' },
        { value: valor, type: String, fontSize: 10 },
    ];

    const cabecalho = (titulos) => titulos.map((t) => ({ value: String(t), type: String, ...estiloCabecalho }));

    const celulaTexto = (v, extra = {}) => ({ value: String(v ?? '—'), type: String, ...estiloBase, ...extra });
    const celulaNumero = (v, extra = {}) => ({ value: Number(v) || 0, type: Number, ...estiloBase, align: 'right', ...extra });

    const folhas = [];

    // ── Folha 1: resumo executivo ────────────────────────────
    const nColsResumo = CABECALHO_RESUMO.length;
    const resumo = [
        titulo('RELATÓRIO DE GESTÃO DE PEQUENAS AQUISIÇÕES', nColsResumo),
        parMetadados('Período de referência', report.report?.period?.label || '—'),
        parMetadados('Sistema', report.report?.system || 'MOSAP3'),
        parMetadados('Emitido em', new Date().toLocaleString('pt-AO')),
    ];
    const emissor = emitidoPor(signatario);
    if (emissor) resumo.push(parMetadados('Emitido por', emissor));
    resumo.push([], cabecalho(CABECALHO_RESUMO));

    (report.summary?.by_category || []).forEach((l) => {
        resumo.push([
            celulaTexto(l.label),
            celulaNumero(l.completed),
            celulaNumero(l.in_progress),
            celulaNumero(l.late, l.late > 0 ? { color: '#B91C1C', fontWeight: 'bold' } : {}),
        ]);
    });

    const t = report.summary?.total;
    if (t) {
        const destaque = { fontWeight: 'bold', backgroundColor: CINZA_FUNDO };
        resumo.push([
            celulaTexto('TOTAL GLOBAL', destaque),
            celulaNumero(t.completed, destaque),
            celulaNumero(t.in_progress, destaque),
            celulaNumero(t.late, destaque),
        ]);
    }

    folhas.push({
        sheet: 'Resumo Executivo',
        data: resumo,
        columns: [{ width: 34 }, { width: 16 }, { width: 16 }, { width: 16 }],
    });

    // ── Uma folha por categoria com processos ────────────────
    secoesComLinhas(report).forEach(([chave, cat]) => {
        const colunas = colunasVisiveis(cat.columns);
        const n = colunas.length;

        const dados = [
            titulo(cat.label, n),
            legenda(cat.description || '', n),
            [],
            cabecalho(colunas.map(([, rotulo]) => rotulo)),
            ...(cat.rows || []).map((row) => colunas.map(([k]) => celulaTexto(
                cellValue(row, k),
                k === 'code' ? { fontFamily: 'Consolas' } : (k === 'description' ? { wrap: true } : {}),
            ))),
        ];

        folhas.push({
            // O Excel limita os nomes de folha a 31 caracteres.
            sheet: (cat.label || chave).slice(0, 31),
            data: dados,
            columns: colunas.map(([k]) => ({ width: LARGURA_COLUNA[k] || 22 })),
            // O cabeçalho fica fixo ao rolar a lista de processos.
            stickyRowsCount: 4,
        });
    });

    // ── Última folha: desempenho ─────────────────────────────
    folhas.push({
        sheet: 'Desempenho',
        data: [
            titulo('ANÁLISE DE DESEMPENHO E CONFORMIDADE', 2),
            [],
            cabecalho(['Indicador', 'Valor']),
            ...indicadoresDesempenho(report).map(([rotulo, valor]) => [
                celulaTexto(rotulo),
                celulaTexto(valor, { align: 'right' }),
            ]),
        ],
        columns: [{ width: 42 }, { width: 20 }],
    });

    // Sem `fileName` devolve { toBlob }, para os quatro formatos partilharem o
    // mesmo caminho de download.
    const { toBlob } = await writeXlsxFile(folhas, { fontFamily: 'Calibri', fontSize: 11 });
    descarregar(await toBlob(), nomeFicheiro(report, 'xlsx'));
}

// ── CSV ──────────────────────────────────────────────────────
export function exportarCSV(report, signatario = null) {
    const esc = (v) => {
        const t = String(v ?? '');
        return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const linha = (celulas) => celulas.map(esc).join(';');
    const out = [];

    out.push(linha(['RELATÓRIO DE GESTÃO DE PEQUENAS AQUISIÇÕES']));
    out.push(linha(['Período de referência', report.report?.period?.label || '—']));
    out.push(linha(['Emitido em', new Date().toLocaleString('pt-AO')]));
    const emissor = emitidoPor(signatario);
    if (emissor) out.push(linha(['Emitido por', emissor]));
    out.push('');

    out.push(linha(['RESUMO EXECUTIVO']));
    out.push(linha(CABECALHO_RESUMO));
    linhasResumo(report).forEach((l) => out.push(linha(l)));
    out.push('');

    for (const [, cat] of secoesComLinhas(report)) {
        const colunas = colunasVisiveis(cat.columns);
        out.push(linha([cat.label.toUpperCase()]));
        out.push(linha(colunas.map(([, titulo]) => titulo)));
        (cat.rows || []).forEach((row) => out.push(linha(colunas.map(([k]) => cellValue(row, k)))));
        out.push('');
    }

    out.push(linha(['ANÁLISE DE DESEMPENHO']));
    indicadoresDesempenho(report).forEach((l) => out.push(linha(l)));

    // BOM para o Excel reconhecer os acentos
    descarregar(
        new Blob(['﻿' + out.join('\r\n')], { type: 'text/csv;charset=utf-8;' }),
        nomeFicheiro(report, 'csv'),
    );
}
