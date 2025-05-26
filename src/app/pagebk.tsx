"use client";

import Image from "next/image";
import { useState } from "react";
import DropZone from "@/src/app/components/ui/DropZone";


export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    console.log("Arquivo recebido:", file.name, file.type, file.size);
    // Aqui você pode adicionar sua lógica para processar o arquivo
  };

  return (
    
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <div className="w-full">
          <h2 className="text-xl font-bold mb-4">Selecione um arquivo para análise</h2>
          <DropZone 
            label="Arraste e solte ou clique para selecionar um arquivo"
            onFile={handleFile}
            accept=".pdf,.doc,.docx,.txt"
          />
          {selectedFile && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p>Arquivo selecionado: <strong>{selectedFile.name}</strong></p>
              <p>Tipo: {selectedFile.type || "Não especificado"}</p>
              <p>Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>

</main>
</div>

  );
}
