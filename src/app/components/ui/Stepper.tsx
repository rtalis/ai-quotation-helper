"use client"

import * as React from "react"
import { Check, ChevronRight, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StepProps {
  title: string
  description?: string
  isCompleted?: boolean
  isActive?: boolean
  hasError?: boolean
}

const Step: React.FC<StepProps> = ({ title, description, isCompleted, isActive, hasError }) => {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : isActive
                ? "border-primary"
                : hasError
                  ? "border-destructive"
                  : "border-muted",
          )}
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          ) : hasError ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            <span className="text-sm font-medium">{title[0]}</span>
          )}
        </motion.div>
      </div>
      <motion.div 
        className="ml-4"
        initial={{ x: -5, opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className={cn(
          "text-sm font-medium", 
          isActive || isCompleted 
            ? "text-foreground" 
            : hasError 
              ? "text-destructive" 
              : "text-muted-foreground"
        )}>
          {title}
        </p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </motion.div>
    </div>
  )
}

interface StepperProps {
  steps: Array<{ title: string; description?: string; validator?: () => Promise<boolean> | boolean }>
  currentStep: number
  onStepChange: (step: number) => void
  stepData?: Record<string, any>
}

export function Stepper({ steps, currentStep, onStepChange, stepData = {} }: StepperProps) {
  const [stepStatus, setStepStatus] = React.useState<Array<'incomplete' | 'complete' | 'error'>>(() => 
    steps.map(() => 'incomplete')
  );
  const [isValidating, setIsValidating] = React.useState(false);

  // Função para verificar se uma etapa está concluída
  const checkStepCompletion = React.useCallback(async (stepIndex: number) => {
    const step = steps[stepIndex];
    
    if (!step.validator) {
      return true; // Se não houver validador, consideramos a etapa concluída
    }

    try {
      setIsValidating(true);
      const isValid = await step.validator();
      
      setStepStatus(prev => {
        const newStatus = [...prev];
        newStatus[stepIndex] = isValid ? 'complete' : 'error';
        return newStatus;
      });
      
      return isValid;
    } catch (error) {
      console.error(`Erro ao validar etapa ${stepIndex}:`, error);
      
      setStepStatus(prev => {
        const newStatus = [...prev];
        newStatus[stepIndex] = 'error';
        return newStatus;
      });
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [steps]);

  // Avançar para a próxima etapa com validação
  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const isStepValid = await checkStepCompletion(currentStep);
      
      if (isStepValid) {
        setStepStatus(prev => {
          const newStatus = [...prev];
          newStatus[currentStep] = 'complete';
          return newStatus;
        });
        onStepChange(currentStep + 1);
      }
    }
  };

  // Voltar para a etapa anterior
  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <Step
              title={step.title}
              description={step.description}
              isCompleted={stepStatus[index] === 'complete' || index < currentStep}
              isActive={index === currentStep}
              hasError={stepStatus[index] === 'error'}
            />
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <ChevronRight className="hidden md:block text-muted-foreground" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 p-4 border rounded-md bg-card"
        >
          {/* Aqui você pode renderizar o conteúdo de cada etapa */}
          <h3 className="text-lg font-medium mb-2">{steps[currentStep].title}</h3>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
          
          {/* Slot para conteúdo dinâmico da etapa */}
          {stepData[`step${currentStep + 1}Content`]}
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 0}
        >
          Anterior
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={currentStep === steps.length - 1 || isValidating}
        >
          {isValidating ? "Verificando..." : currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
        </Button>
      </div>
    </div>
  )
}