"use client"

import { useState, useEffect } from "react"
import { Stepper } from "@/components/ui/Stepper"
import { ReferenceQuotationStep } from "@/app/components/ui/RefefenceQuotationStep"
import { SupplierQuotationsStep } from "@/app/components/ui/SupplierQuotationStep"
import { ComparisonResultsStep } from "@/app/components/ui/ComparisonResultsStep"
import { ReferenceData, ComparisonResult } from "@/app/types"
import { toast } from "sonner"

const steps = [
  {
    title: "Adicione a cotação de referencia",
    description: "Envie o arquivo de cotação modelo",
    validator: async (data: { referenceData: ReferenceData | null }) => {
      if (!data.referenceData) {
        toast({
          message: "Cotação de referência obrigatória",
          description: "Por favor, adicione e processe a cotação de referência para continuar.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
  },
  {
    title: "Arquivos de cotação",
    description: "Adicione as cotações dos fornecedores",
    validator: async (data: { comparisonResults: ComparisonResult | null }) => {
      if (!data.comparisonResults) {
        toast({
          message: "Análise de cotações obrigatória",
          description: "Por favor, adicione e processe cotações de fornecedores para continuar.",
          variant: "destructive",
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
]

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

  // Validadores de etapa customizados com acesso aos dados
  const stepsWithValidation = steps.map((step, index) => {
    if (index === 0) {
      return {
        ...step,
        validator: () => step.validator({ referenceData, comparisonResults })
      };
    } else if (index === 1) {
      return {
        ...step,
        validator: () => step.validator({ referenceData, comparisonResults })
      };
    }
    return step;
  });

  const stepContent = {
    step1Content: (
      <ReferenceQuotationStep 
        onReferenceDataChange={setReferenceData}
        referenceData={referenceData}
      />
    ),
    step2Content: (
      <SupplierQuotationsStep 
        referenceData={referenceData}
        onComparisonResultsChange={setComparisonResults}
      />
    ),
    step3Content: (
      <ComparisonResultsStep 
        comparisonResults={comparisonResults}
      />
    )
  };

  return (
    <div className="container mx-auto py-10 max-w-[70%]">
      <h1 className="text-2xl font-bold mb-8 text-center">Comparação de Cotações</h1>
      <Stepper
        steps={stepsWithValidation}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        stepData={stepContent}
        allowReturn={true} // Permite voltar para etapas anteriores
        visitedSteps={Array.from(visitedSteps)} // Passa os passos já visitados
      />
    </div>
  );
}