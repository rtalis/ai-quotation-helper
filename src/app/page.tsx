"use client"

import { useState, ReactNode, useEffect } from "react"
import { Stepper } from "@/components/ui/Stepper"
import DropZone from "@/components/ui/DropZone";
import { File, FileImage, FileText, X, Loader2 } from "lucide-react";
import { analyzeReferencePDF } from "@/app/api/pdfExtractionService";
import { Button } from "@/components/ui/button";

const steps = [
  { 
    title: "Adicione a cotação de referencia", 
    description: "envie o arquivo de cotação modelo", 
    validator: () => Promise.resolve(true) // Substitua com validação real
  },
  { 
    title: "Arquivos de cotação", 
    description: "Adicione as cotações dos fornecedores", 
    validator: () => Promise.resolve(true) 
  },
  { 
    title: "Resultados",  
    validator: () => Promise.resolve(true) 
  },

]

export default function StepperDemo() {
    const [currentStep, setCurrentStep] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    interface ReferenceData {
      items: { description: string; referencePrice: number; quantity: number; unit: string; manufacturer?: string; code?: string }[];
      totalValue?: number;
    }
    
    const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState("");
  
  // Função para determinar qual ícone mostrar com base na extensão do arquivo
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-700" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  const handleFileUpload = (file: File) => {
    setUploadedFiles(prev => [...prev, file]);
    setReferenceData(null);
    setProcessingError("");
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setReferenceData(null);
    setProcessingError("");
  };
  
  const processReferenceFile = async () => {
    if (uploadedFiles.length === 0) {
      setProcessingError("Por favor, adicione um arquivo para análise.");
      return;
    }
    
    setIsProcessing(true);
    setProcessingError("");
    
    try {
      const file = uploadedFiles[0];
      const buffer = await file.arrayBuffer();
      
      // Converter ArrayBuffer para formato aceito pelo pdf-parse
      const uint8Array = new Uint8Array(buffer);
      
      // Analisar o PDF
      const data = await analyzeReferencePDF(uint8Array);
      setReferenceData(data);
      
      // Avançar automaticamente para o próximo passo
      if (data) {
        setTimeout(() => setCurrentStep(1), 1000);
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      if (error instanceof Error) {
        setProcessingError(error.message || "Erro ao processar o arquivo. Tente novamente.");
      } else {
        setProcessingError("Erro ao processar o arquivo. Tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderiza os itens extraídos
  const renderExtractedItems = () => {
    if (!referenceData || !referenceData.items) return null;
    
    return (
      <div className="mt-4 border rounded-md p-4 bg-card">
        <h4 className="text-sm font-medium mb-2">Itens extraídos</h4>
        <div className="space-y-2">
          {referenceData.items.map((item, index) => (
            <div key={index} className="p-3 border rounded-md bg-background">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{item.description}</span>
                <span className="text-sm font-bold">R$ {item.referencePrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Qtd: {item.quantity} {item.unit}</span>
                {item.manufacturer && <span>Fabricante: {item.manufacturer}</span>}
                {item.code && <span>Código: {item.code}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-2">
          <span className="font-medium">Total:</span>
          <span className="font-bold">R$ {referenceData.totalValue?.toFixed(2) || "0.00"}</span>
        </div>
      </div>
    );
  };

  const stepContent: Record<string, ReactNode> = {
    step1Content: (
      <div className="space-y-4">
        <DropZone 
          label="Clique ou arraste o arquivo de cotação referência aqui"
          onFile={handleFileUpload}
          accept=".pdf"  
        />
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Arquivos adicionados</h4>
            <ul className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <li 
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between px-3 py-2 rounded-md border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.name)}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px] md:max-w-[300px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="rounded-full p-1 hover:bg-muted"
                    aria-label="Remover arquivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mt-4">
              <Button 
                onClick={processReferenceFile} 
                disabled={isProcessing || uploadedFiles.length === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : "Processar cotação"}
              </Button>
              
              {processingError && (
                <p className="text-sm text-destructive mt-2">{processingError}</p>
              )}
            </div>
            
            {referenceData && renderExtractedItems()}
          </div>
        )}
      </div>
    ),

    step2Content: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Adicione os arquivos PDFs das cotações dos fornecedores a serem analisados</h3>
        <div className="grid gap-4">
         DropZone para os arquivos de cotação
        </div>
      </div>
    ),
    
    step3Content: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Descreva o produto</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea 
            className="w-full p-2 border rounded-md h-24" 
            placeholder="Descreva o produto que você precisa"
          />
        </div>
      </div>
    )

}


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8 text-center">Formulário de Cotação</h1>
      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        onStepChange={setCurrentStep} 
        stepData={stepContent}
      />
    </div>
  )
}