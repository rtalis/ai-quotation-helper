"use client"

import { useState, ReactNode } from "react"
import { Stepper } from "@/components/ui/Stepper"
import  DropZone  from "@/components/ui/DropZone";
import { File, FileImage, FileText, X } from "lucide-react";

const steps = [
  { 
    title: "Dados Pessoais", 
    description: "Informe seus dados de contato", 
    validator: () => Promise.resolve(true) // Substitua com validação real
  },
  { 
    title: "Informações do Produto", 
    description: "Descreva o produto desejado", 
    validator: () => Promise.resolve(true) 
  },
  { 
    title: "Envie o arquivo de cotação modelo ",  
    validator: () => Promise.resolve(true) 
  },
  { 
    title: "Revisão", 
    description: "Confirme as informações" 
  },
]

export default function StepperDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  
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
    console.log("Arquivo recebido:", file.name, file.type, file.size);
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  // Conteúdo de cada etapa
  const stepContent: Record<string, ReactNode> = {
    step1Content: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Preencha seus dados pessoais</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md" 
              placeholder="Digite seu nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded-md" 
              placeholder="seuemail@exemplo.com"
            />
          </div>
        </div>
      </div>
    ),
    
    step2Content: (
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
    ),
    
    step3Content: (
        <div className="space-y-4">
          <DropZone 
            label="Clique ou arraste arquivos aqui"
            onFile={handleFileUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"  
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
            </div>
          )}
        </div>
      ),
    
    step4Content: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Revise suas informações</h3>
        <p>Verifique se todos os dados estão corretos antes de finalizar.</p>
        <div className="bg-gray-50 p-4 rounded-md">
          <p><strong>Nome:</strong> [Nome do usuário]</p>
          <p><strong>Email:</strong> [Email do usuário]</p>
          <p><strong>Produto:</strong> [Descrição do produto]</p>
          <p><strong>Arquivos:</strong> [Lista de arquivos]</p>
        </div>
      </div>
    ),
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