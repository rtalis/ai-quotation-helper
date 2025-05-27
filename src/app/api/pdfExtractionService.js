import { analyzeTextWithGemini } from "./gemini";
import * as pdfjsLib from "pdfjs-dist";

// Polyfill para DOMMatrix no ambiente Node.js
if (typeof globalThis.DOMMatrix === 'undefined') {
  const { DOMMatrix } = require('canvas');
  globalThis.DOMMatrix = DOMMatrix;
}

// Configuração do worker
const pdfjsWorker = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();

// Função para extrair texto de um arquivo PDF
const extractTextFromPDF = async (fileBuffer) => {
  try {
    const pdf = await pdfjsLib.getDocument({data: fileBuffer}).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    
    return text;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error("Não foi possível processar o PDF");
  }
};
// Função para analisar cotação de referência
export const analyzeReferencePDF = async (pdfBuffer) => {
  try {
    // Extrair texto do PDF
    const pdfText = await extractTextFromPDF(pdfBuffer);
    
    // Criar prompt para o Gemini
    const prompt = createReferenceExtractionPrompt(pdfText);
    
    // Analisar com Gemini
    const result = await analyzeTextWithGemini(prompt);
    
    // Processar resposta
    try {
      // Extrair JSON da resposta
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result;
      const parsedResult = JSON.parse(jsonStr);
      
      return parsedResult;
    } catch (error) {
      console.error("Erro ao processar resposta do Gemini:", error);
      throw new Error("Não foi possível interpretar a resposta da IA");
    }
  } catch (error) {
    console.error("Erro na análise do PDF:", error);
    throw error;
  }
};

// Prompt para extração de dados da cotação de referência
const createReferenceExtractionPrompt = (pdfText) => {
  return `
Extraia informações estruturadas desta cotação de referência em PDF. Preciso das seguintes informações:
1. Nome do fornecedor/empresa
2. Data da cotação
3. Lista completa de itens com seus respectivos:
   - Código (se disponível)
   - Descrição detalhada
   - Quantidade
   - Unidade (un, kg, caixa, etc.)
   - Preço unitário
   - Preço total
   - Fabricante/marca (se disponível)


Tenha cautela para não trocar o valor total pelo valor unitário e não confunda com o preço total da cotação.

Observe atentamente os valores e formatos. Retorne um JSON válido com esta estrutura:
\`\`\`json
{
  "supplier": "Nome do Fornecedor",
  "date": "Data da Cotação (formato YYYY-MM-DD)",
  "items": [
    {
      "code": "código do item (se disponível)",
      "description": "descrição completa do item",
      "quantity": 1,
      "unit": "unidade (un, kg, etc.)",
      "referencePrice": 99.99,
      "totalPrice": 99.99,
      "manufacturer": "nome do fabricante (se disponível)"
    }
  ],
  "totalValue": 999.99
}
\`\`\`

Conteúdo do PDF:
${pdfText}
`;
};

export const analyzeSupplierPDF = async (pdfBuffer, referenceData) => {
  try {
    // Extrair texto do PDF
    const pdfText = await extractTextFromPDF(pdfBuffer);
    
    // Criar prompt para o Gemini
    const prompt = createSupplierExtractionPrompt(referenceData, pdfText);
    
    // Analisar com Gemini
    const result = await analyzeTextWithGemini(prompt);
    
    // Processar resposta
    try {
      // Extrair JSON da resposta
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result;
      const parsedResult = JSON.parse(jsonStr);
      
      return {
        supplier: parsedResult.supplierName || "Fornecedor desconhecido",
        items: parsedResult.items || []
      };
    } catch (error) {
      console.error("Erro ao processar resposta do Gemini:", error);
      throw new Error("Não foi possível interpretar a resposta da IA");
    }
  } catch (error) {
    console.error("Erro na análise do PDF do fornecedor:", error);
    throw error;
  }
};

// Função para comparar todas as cotações e encontrar o melhor preço
export const compareAllQuotations = async (referenceData, supplierQuotations) => {
  if (!referenceData || !referenceData.items || !supplierQuotations || supplierQuotations.length === 0) {
    throw new Error("Dados insuficientes para comparação");
  }
  
  // Preparar o resultado da comparação
  const comparisonResults = {
    items: [],
    allQuotes: [], // Armazenará todas as cotações
    supplierTotals: {}, // Para calcular o total por fornecedor
    totalOriginal: 0,
    totalBest: 0,
    totalSavings: 0
  };
  
  // Para cada item na cotação de referência, encontrar todos os preços
  for (const refItem of referenceData.items) {
    const itemMatches = [];
    const allQuotesForItem = [];
    
    // Buscar o item em cada cotação de fornecedor
    for (const quote of supplierQuotations) {
      // Encontrar item correspondente na cotação do fornecedor
      const matchedItem = quote.items.find(item => 
        (item.matchedItemDescription && areSimilarDescriptions(item.matchedItemDescription, refItem.description)) ||
        (item.code && refItem.code && item.code === refItem.code) || 
        areSimilarDescriptions(item.description, refItem.description)
      );
      
      if (matchedItem) {
        const price = parseFloat(matchedItem.price);
        const totalPrice = price * refItem.quantity;
        
        // Adicionar à lista de correspondências para encontrar o melhor preço
        itemMatches.push({
          supplier: quote.supplier,
          price: price,
          totalPrice: totalPrice,
          manufacturer: matchedItem.manufacturer || "Não informado",
          matchConfidence: matchedItem.matchConfidence || "Média"
        });
        
        // Adicionar à lista completa de cotações
        allQuotesForItem.push({
          supplier: quote.supplier,
          price: price,
          totalPrice: totalPrice,
          description: matchedItem.description,
          manufacturer: matchedItem.manufacturer || "Não informado",
          matchConfidence: matchedItem.matchConfidence || "Média"
        });
        
        // Atualizar o total do fornecedor
        if (!comparisonResults.supplierTotals[quote.supplier]) {
          comparisonResults.supplierTotals[quote.supplier] = 0;
        }
        comparisonResults.supplierTotals[quote.supplier] += totalPrice;
        
        // Adicionar à lista global de cotações
        comparisonResults.allQuotes.push({
          supplier: quote.supplier,
          itemCode: refItem.code,
          itemDescription: refItem.description,
          price: price,
          totalPrice: totalPrice,
          manufacturer: matchedItem.manufacturer || "Não informado",
          matchConfidence: matchedItem.matchConfidence || "Média"
        });
      }
    }
    
    // Se encontramos correspondências, determinar o melhor preço
    if (itemMatches.length > 0) {
      // Ordenar por preço (menor primeiro)
      itemMatches.sort((a, b) => a.totalPrice - b.totalPrice);
      const bestMatch = itemMatches[0];
      
      const originalPrice = refItem.referencePrice * refItem.quantity;
      const savings = originalPrice > 0 ? 
        (originalPrice - bestMatch.totalPrice) / originalPrice : 0;
      
      comparisonResults.items.push({
        code: refItem.code,
        description: refItem.description,
        quantity: refItem.quantity,
        unit: refItem.unit,
        bestPrice: bestMatch.totalPrice,
        pricePerUnit: bestMatch.price,
        supplier: bestMatch.supplier,
        manufacturer: bestMatch.manufacturer || "Não informado",
        matchConfidence: bestMatch.matchConfidence || "Média",
        originalPrice: originalPrice,
        savings: savings,
        allQuotes: allQuotesForItem // Adicionar todas as cotações para este item
      });
      
      comparisonResults.totalOriginal += originalPrice;
      comparisonResults.totalBest += bestMatch.totalPrice;
    } else {
      // Item não encontrado em nenhuma cotação
      comparisonResults.items.push({
        code: refItem.code,
        description: refItem.description,
        quantity: refItem.quantity,
        unit: refItem.unit,
        bestPrice: 0,
        pricePerUnit: 0,
        supplier: "Não encontrado",
        manufacturer: "Não informado",
        matchConfidence: "Nenhuma",
        originalPrice: refItem.referencePrice * refItem.quantity,
        savings: 0,
        allQuotes: [] // Nenhuma cotação encontrada
      });
      
      comparisonResults.totalOriginal += refItem.referencePrice * refItem.quantity;
    }
  }
  
  // Calcular economia total
  comparisonResults.totalSavings = comparisonResults.totalOriginal > 0 ? 
    (comparisonResults.totalOriginal - comparisonResults.totalBest) / comparisonResults.totalOriginal : 0;
  
  return comparisonResults;
};

// Prompt para extração de dados das cotações de fornecedores
const createSupplierExtractionPrompt = (referenceData, pdfText) => {
  const itemsList = referenceData.items.map((item, index) => 
    `${index + 1}. ${item.code ? `Código: ${item.code}, ` : ''}Descrição: "${item.description}", Unidade: ${item.unit}, Quantidade: ${item.quantity}`
  ).join('\n');

  return `
Extraia informações estruturadas desta cotação de fornecedor em PDF. Preciso das seguintes informações:
1. Nome do fornecedor
2. Itens cotados com seus respectivos códigos, descrições, fabricantes e preços unitários

Os itens que estou procurando na cotação são:
${itemsList}

O código pode ser genérico e não é encontrado no PDF, NÃO USE o código para dar match entre os itens.
A descrição é o dado mais importante para identificar os itens.

Para cada item encontrado no PDF:
1. Identifique o código e descrição do item no PDF
2. Determine a qual item da minha lista ele corresponde e coloque a descrição desse item no campo "matchedItemDescription"
3. Indique o nível de confiança na correspondência no campo "matchConfidence" (Alta, Média ou Baixa)
4. Extraia o nome do fabricante do produto quando disponível

Observe que o fornecedor pode usar códigos ou descrições diferentes, então use aproximação semântica para identificar os itens corretamente.
Tenha cautela para obter o valor unitário do item ao inves do valor total, e não confunda com o preço total da cotação.
Retorne um JSON válido com esta estrutura:
\`\`\`json
{
  "supplierName": "Nome do Fornecedor",
  "items": [
    {
      "code": "código do item no PDF (se disponível)",
      "matchedItemDescription": "descrição do item na minha lista que corresponde a este item",
      "description": "descrição do item como aparece no PDF",
      "price": 99.99,
      "unit": "unidade (se disponível)",
      "manufacturer": "nome do fabricante",
      "matchConfidence": "Alta/Média/Baixa"
    }
  ]
}
\`\`\`

Conteúdo do PDF:
${pdfText}
`;
};

// Função auxiliar para comparar similaridade de descrições
const areSimilarDescriptions = (desc1, desc2) => {
  if (!desc1 || !desc2) return false;
  
  // Simplificar as descrições para comparação
  const normalize = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remover pontuação
      .replace(/\s+/g, ' ')     // Normalizar espaços
      .trim();
  };
  
  const normalized1 = normalize(desc1);
  const normalized2 = normalize(desc2);
  
  // Verificar se uma é substring da outra
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  /*
  // Verificar palavras-chave em comum
  const words1 = normalized1.split(' ').filter(w => w.length > 3);
  const words2 = normalized2.split(' ').filter(w => w.length > 3);
  
  // Contar palavras em comum
  const commonWords = words1.filter(w => words2.includes(w));
  
  // Se há pelo menos 2 palavras significativas em comum ou 50% das palavras, considerar similar
  return commonWords.length >= 2 || 
         (words1.length > 0 && commonWords.length / words1.length >= 0.5) ||
         (words2.length > 0 && commonWords.length / words2.length >= 0.5);
*/
         };