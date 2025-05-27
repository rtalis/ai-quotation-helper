"use client"

import { useState, useEffect } from "react"
import { Stepper } from "@/components/ui/Stepper"
import { ReferenceQuotationStep } from "@/app/components/ui/RefefenceQuotationStep"
import { SupplierQuotationsStep } from "@/app/components/ui/SupplierQuotationStep"
import { ComparisonResultsStep } from "@/app/components/ui/ComparisonResultsStep"
import { ReferenceData, ComparisonResult } from "@/app/types"
import { toast } from "sonner"

// Definição dos tipos de validadores
type StepValidator = () => Promise<boolean> | boolean;
type ContextualValidator = (context: { 
  referenceData: ReferenceData | null; 
  comparisonResults: ComparisonResult | null 
}) => Promise<boolean> | boolean;

// Definição dos passos com validadores contextuais
const stepsDefinition: Array<{
  title: string;
  description: string;
  validator: ContextualValidator;
}> = [
  {
    title: "Adicione a cotação de referencia",
    description: "Envie o arquivo de cotação modelo",
    validator: async ({ referenceData }) => {
      if (!referenceData) {
        toast.info("Cotação de referência obrigatória", {
          description: "Por favor, adicione e processe a cotação de referência para continuar.",
        });
        return false;
      }
      return true;
    }
  },
  {
    title: "Arquivos de cotação",
    description: "Adicione as cotações dos fornecedores",
    validator: async ({ comparisonResults }) => {
      if (!comparisonResults) {
        toast.info("Análise de cotações obrigatória", {
          description: "Por favor, adicione e processe cotações de fornecedores para continuar.",
        });
        return false;
      }
      return true;
    }
  },
  {
    title: "Resultados",
    description: "Veja a comparação entre cotações",
    validator: () => Promise.resolve(true)
  },
];

export default function StepperDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  // Função para gerenciar a mudança de etapas com histórico
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setVisitedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(step);
      return newSet;
    });
  };

  // Avançar automaticamente para o próximo passo quando os dados forem processados
  useEffect(() => {
    if (referenceData && currentStep === 0 && !visitedSteps.has(1)) {
      setTimeout(() => handleStepChange(1), 1000);
    }
  }, [referenceData, currentStep, visitedSteps]);

  useEffect(() => {
    if (comparisonResults && currentStep === 1 && !visitedSteps.has(2)) {
      setTimeout(() => handleStepChange(2), 1000);
    }
  }, [comparisonResults, currentStep, visitedSteps]);


  const stepsWithValidation = stepsDefinition.map((step) => {
    return {
      title: step.title,
      description: step.description,
      validator: (): Promise<boolean> | boolean => {
        return step.validator({ referenceData, comparisonResults });
      }
    };
  });

  const stepContent = {
    step1Content: (
      <div key="step1">
        <ReferenceQuotationStep 
          onReferenceDataChange={setReferenceData}
          referenceData={referenceData}
          key="reference-step" // Adicionada key para estabilidade
        />
      </div>
    ),
    step2Content: (
      <div key="step2">
        <SupplierQuotationsStep 
          referenceData={referenceData}
          onComparisonResultsChange={setComparisonResults}
          key="supplier-step" // Adicionada key para estabilidade
        />
      </div>
    ),
    step3Content: (
      <div key="step3">
        <ComparisonResultsStep 
          comparisonResults={comparisonResults}
          key="results-step" // Adicionada key para estabilidade
        />
      </div>
    )
  };

  return (
    <div className="container mx-auto py-10 max-w-[90%]">
      <h1 className="text-2xl font-bold mb-8 text-center">Comparação de Cotações</h1>
      <Stepper
        steps={stepsWithValidation}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        stepData={stepContent}
        allowReturn={true} 
        visitedSteps={Array.from(visitedSteps)}
      />
    </div>
  );
}