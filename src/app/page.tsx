"use client"

import { useState, useEffect } from "react"
import { Stepper } from "@/components/ui/Stepper"
import { ReferenceQuotationStep } from "@/app/components/ui/RefefenceQuotationStep"
import { SupplierQuotationsStep } from "@/app/components/ui/SupplierQuotationStep"
import { ComparisonResultsStep } from "@/app/components/ui/ComparisonResultsStep"
import { ReferenceData, ComparisonResult } from "@/app/types"

const steps = [
  {
    title: "Adicione a cotação de referencia",
    description: "Envie o arquivo de cotação modelo",
    validator: () => Promise.resolve(true)
  },
  {
    title: "Arquivos de cotação",
    description: "Adicione as cotações dos fornecedores",
    validator: () => Promise.resolve(true)
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

  // Avançar automaticamente para o próximo passo quando os dados forem processados
  useEffect(() => {
    if (referenceData && currentStep === 0) {
      setTimeout(() => setCurrentStep(1), 1000);
    }
  }, [referenceData, currentStep]);

  useEffect(() => {
    if (comparisonResults && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 1000);
    }
  }, [comparisonResults, currentStep]);

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
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8 text-center">Comparação de Cotações</h1>
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        stepData={stepContent}
      />
    </div>
  );
}