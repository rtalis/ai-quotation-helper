"use client"

import { useState } from "react"
import { Stepper } from "@/components/ui/Stepper"

const steps = [
  { title: "Step 1", description: "Create your account" },
  { title: "Step 2", description: "Verify your email" },
  { title: "Step 3", description: "Add your details" },
  { title: "Step 4", description: "Confirm and finish" },
]

export default function StepperDemo() {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8 text-center">Stepper Demo</h1>
      <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
      <div className="mt-8 p-4 border rounded-md">
        <h2 className="text-lg font-semibold mb-2">Current Step Content</h2>
        <p>{steps[currentStep].description}</p>
      </div>
    </div>
  )
}