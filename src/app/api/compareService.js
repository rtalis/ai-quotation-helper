import { analyzeTextWithGemini } from "./gemini";

export const compareQuotations = async (xmlData, pdfDataList) => {
  if (!xmlData || !xmlData.items || !pdfDataList || pdfDataList.length === 0) {
    throw new Error("Dados insuficientes para comparação");
  }
  
  // Para cada PDF, extrair informações estruturadas com a ajuda do Gemini
  const structuredQuotes = await Promise.all(pdfDataList.map(async (pdfData) => {
    const prompt = createExtractionPrompt(xmlData, pdfData.text);
    const result = await analyzeTextWithGemini(prompt);
    
    // Processar a resposta estruturada do Gemini
    try {
      // Vamos pedir ao Gemini para nos retornar um JSON válido
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result;
      const parsedResult = JSON.parse(jsonStr);
      
      return {
        supplier: parsedResult.supplierName || pdfData.fileName,
        items: parsedResult.items || []
      };
    } catch (error) {
      console.error("Erro ao processar resposta do Gemini:", error);
      return {
        supplier: pdfData.fileName,
        items: []
      };
    }
  }));
  
  // Preparar o resultado da comparação
  const comparisonResults = {
    items: [],
    allQuotes: [], // Armazenará todas as cotações
    supplierTotals: {}, // Para calcular o total por fornecedor
    totalOriginal: 0,
    totalBest: 0,
    totalSavings: 0
  };
  
  // Para cada item no XML, encontrar todos os preços
  for (const xmlItem of xmlData.items) {
    const itemMatches = [];
    const allQuotesForItem = [];
    
    // Buscar o item em cada cotação
    for (const quote of structuredQuotes) {
      // Preferir usar o matchedItemDescription para comparar com a descrição
      const matchedItem = quote.items.find(item => 
        (item.matchedItemDescription && areSimilarDescriptions(item.matchedItemDescription, xmlItem.description)) ||
        item.code === xmlItem.code || 
        areSimilarDescriptions(item.description, xmlItem.description)
      );
      
      if (matchedItem) {
        const price = parseFloat(matchedItem.price);
        const totalPrice = price * xmlItem.quantity;
        
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
          itemCode: xmlItem.code,
          itemDescription: xmlItem.description,
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
      
      const originalPrice = xmlItem.referencePrice * xmlItem.quantity;
      const savings = originalPrice > 0 ? 
        (originalPrice - bestMatch.totalPrice) / originalPrice : 0;
      
      comparisonResults.items.push({
        code: xmlItem.code,
        description: xmlItem.description,
        quantity: xmlItem.quantity,
        unit: xmlItem.unit,
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
        code: xmlItem.code,
        description: xmlItem.description,
        quantity: xmlItem.quantity,
        unit: xmlItem.unit,
        bestPrice: 0,
        pricePerUnit: 0,
        supplier: "Não encontrado",
        manufacturer: "Não informado",
        matchConfidence: "Nenhuma",
        originalPrice: xmlItem.referencePrice * xmlItem.quantity,
        savings: 0,
        allQuotes: [] // Nenhuma cotação encontrada
      });
      
      comparisonResults.totalOriginal += xmlItem.referencePrice * xmlItem.quantity;
    }
  }
  
  // Calcular economia total
  comparisonResults.totalSavings = comparisonResults.totalOriginal > 0 ? 
    (comparisonResults.totalOriginal - comparisonResults.totalBest) / comparisonResults.totalOriginal : 0;
  
  return comparisonResults;
};

// Função para criar o prompt para o Gemini
const createExtractionPrompt = (xmlData, pdfText) => {
  const itemsList = xmlData.items.map((item, index) => 
    `${index + 1}. Código: ${item.code}, Descrição: "${item.description}", Unidade: ${item.unit}`
  ).join('\n');

  return `
Extraia informações estruturadas desta cotação em PDF. Preciso das seguintes informações:
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