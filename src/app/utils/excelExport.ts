import * as XLSX from 'xlsx';
import { ComparisonResult } from '@/app/types';

/**
 * Exporta os resultados da comparação para um arquivo Excel
 * @param comparisonResults Dados da comparação
 * @param fileName Nome do arquivo a ser gerado (opcional)
 */
export const exportToExcel = (comparisonResults: ComparisonResult, fileName: string = 'comparacao-cotacoes.xlsx') => {
  if (!comparisonResults) return;
  
  // Criar workbook
  const workbook = XLSX.utils.book_new();
  
  // 1. PLANILHA COMPARATIVA (NOVA PLANILHA PRINCIPAL)
  // ------------------------------------------------
  
  // Obter lista de todos os fornecedores
  const allSuppliers = [...new Set(comparisonResults.allQuotes.map(quote => quote.supplier))];
  
  // Preparar cabeçalho da tabela
  const comparativeHeader = ['Código', 'Descrição', 'Quantidade', 'Preço Referência', ...allSuppliers, 'Melhor Preço', 'Melhor Fornecedor'];
  
  // Preparar matriz de dados
  const comparativeData = [comparativeHeader];
  
  // Para cada item, criar uma linha com preços de todos os fornecedores
  comparisonResults.items.forEach(item => {
    const row = [
      item.code || '-',
      item.description,
      item.quantity.toString(),
      `R$ ${item.originalPrice.toFixed(2)}`
    ];
    
    // Adicionar preço de cada fornecedor
    allSuppliers.forEach(supplier => {
      // Encontrar a cotação deste fornecedor para este item
      const quote = item.allQuotes.find(q => q.supplier === supplier);
      if (quote) {
        row.push(`R$ ${quote.price.toFixed(2)}`);
      } else {
        row.push('Não cotado');
      }
    });
    
    // Adicionar melhor preço e fornecedor
    row.push(`R$ ${item.bestPrice.toFixed(2)}`);
    row.push(item.supplier);
    
    comparativeData.push(row);
  });
  
  // Adicionar linha de total
  const totalRow = [
    '', 'TOTAL', '', `R$ ${comparisonResults.totalOriginal.toFixed(2)}`
  ];
  
  // Calcular total por fornecedor
  allSuppliers.forEach(supplier => {
    const total = comparisonResults.supplierTotals[supplier] || 0;
    totalRow.push(`R$ ${total.toFixed(2)}`);
  });
  
  // Adicionar melhor total
  totalRow.push(`R$ ${comparisonResults.totalBest.toFixed(2)}`);
  totalRow.push('');
  
  comparativeData.push(totalRow);
  
  // Criar planilha
  const comparativeSheet = XLSX.utils.aoa_to_sheet(comparativeData);
  
  // Definir larguras de coluna
  const comparativeColWidths = [
    { wch: 12 }, // Código
    { wch: 40 }, // Descrição
    { wch: 10 }, // Quantidade
    { wch: 15 }, // Preço Referência
  ];
  
  // Adicionar largura para cada fornecedor
  allSuppliers.forEach(() => {
    comparativeColWidths.push({ wch: 15 }); // Largura para cada fornecedor
  });
  
  // Adicionar larguras para as últimas colunas
  comparativeColWidths.push({ wch: 15 }); // Melhor Preço
  comparativeColWidths.push({ wch: 20 }); // Melhor Fornecedor
  
  comparativeSheet['!cols'] = comparativeColWidths;
  
  // Adicionar planilha ao workbook (como primeira planilha)
  XLSX.utils.book_append_sheet(workbook, comparativeSheet, 'Comparativo');
  
  // 2. PLANILHA DE RESUMO
  // ---------------------
  
  // Formatar dados para a planilha resumo
  const summaryData = [
    ['Resumo da Comparação de Cotações', ''],
    ['', ''],
    ['Valor Original Total:', `R$ ${comparisonResults.totalOriginal.toFixed(2)}`],
    ['Melhor Valor Total:', `R$ ${comparisonResults.totalBest.toFixed(2)}`],
    ['Economia Total:', `R$ ${(comparisonResults.totalOriginal - comparisonResults.totalBest).toFixed(2)}`],
    ['Economia Percentual:', `${(comparisonResults.totalSavings * 100).toFixed(2)}%`],
    ['Número de Itens:', comparisonResults.items.length],
    ['Número de Fornecedores:', Object.keys(comparisonResults.supplierTotals).length],
    ['', ''],
    ['Resumo por Fornecedor', ''],
    ['Fornecedor', 'Valor Total', 'Itens com Melhor Preço', 'Proporção do Total'],
  ];
  
  // Adicionar dados de cada fornecedor
  Object.entries(comparisonResults.supplierTotals).forEach(([supplier, total]) => {
    const itemsWon = comparisonResults.items.filter(item => item.supplier === supplier).length;
    const proportion = total / comparisonResults.totalBest;
    summaryData.push([
      supplier,
      `R$ ${Number(total).toFixed(2)}`,
      `${itemsWon} de ${comparisonResults.items.length}`,
      `${(proportion * 100).toFixed(2)}%`
    ]);
  });
  
  // Adicionar planilha de resumo
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
  
  // 3. PLANILHA DE ITENS
  // --------------------
  
  // Formatar dados para a planilha de itens
  const itemsData = [
    ['Comparação de Itens'],
    [''],
    ['Código', 'Descrição', 'Quantidade', 'Unidade', 'Preço Original', 'Melhor Preço', 'Fornecedor', 'Economia', 'Confiança'],
  ];
  
  // Adicionar dados de cada item
  comparisonResults.items.forEach(item => {
    itemsData.push([
      item.code || '',
      item.description,
      item.quantity.toString(),
      item.unit,
      `R$ ${item.originalPrice.toFixed(2)}`,
      `R$ ${item.bestPrice.toFixed(2)}`,
      item.supplier,
      `${(item.savings * 100).toFixed(2)}%`,
      item.matchConfidence
    ]);
  });
  
  // Adicionar planilha de itens
  const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Itens');
  
  // 4. PLANILHA DE DETALHAMENTO
  // ---------------------------
  
  // Criar planilha detalhada com todas as cotações
  const detailedData = [
    ['Detalhamento de Todas as Cotações'],
    [''],
    ['Descrição', 'Fornecedor', 'Preço Unitário', 'Quantidade', 'Preço Total', 'Fabricante', 'Confiança'],
  ];
  
  // Adicionar todas as cotações para cada item
  comparisonResults.items.forEach(item => {
    // Adicionar linha separadora com o nome do item
    detailedData.push([
      `Item: ${item.description}`, '', '', '', '', '', ''
    ]);
    
    // Adicionar todas as cotações para este item
    item.allQuotes.forEach(quote => {
      detailedData.push([
        item.description,
        quote.supplier,
        `R$ ${quote.price.toFixed(2)}`,
        item.quantity.toString(),
        `R$ ${quote.totalPrice.toFixed(2)}`,
        quote.manufacturer,
        quote.matchConfidence
      ]);
    });
    
    // Linha em branco após cada item
    detailedData.push(['', '', '', '', '', '', '']);
  });
  
  // Adicionar planilha detalhada
  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detalhamento');
  
  // Aplicar estilos (larguras de coluna) para as planilhas existentes
  const setColumnWidths = (worksheet: XLSX.WorkSheet): void => {
    const columnWidths: Array<{ wch: number }> = [
        { wch: 15 }, // A
        { wch: 40 }, // B
        { wch: 12 }, // C
        { wch: 10 }, // D
        { wch: 15 }, // E
        { wch: 15 }, // F
        { wch: 20 }, // G
        { wch: 12 }, // H
        { wch: 12 }, // I
    ];
    worksheet['!cols'] = columnWidths;
  };
  
  setColumnWidths(summarySheet);
  setColumnWidths(itemsSheet);
  setColumnWidths(detailedSheet);
  
  // Gerar arquivo e fazer download
  XLSX.writeFile(workbook, fileName);
};