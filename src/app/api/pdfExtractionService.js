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