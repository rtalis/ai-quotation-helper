"use client";

import { useState } from "react";
import DropZone from "@/components/ui/DropZone";
import { Button } from "@/components/ui/button";
import { File, FileText, X, Loader2 } from "lucide-react";
import { analyzeSupplierPDF, compareAllQuotations } from "@/app/api/pdfExtractionService";
import { ReferenceData, SupplierQuotation, ComparisonResult } from "../../types";

interface SupplierQuotationsStepProps {
    referenceData: ReferenceData | null;
    onComparisonResultsChange: (results: ComparisonResult) => void;
}

export const SupplierQuotationsStep: React.FC<SupplierQuotationsStepProps> = ({
    referenceData,
    onComparisonResultsChange,
}) => {
    const [supplierFiles, setSupplierFiles] = useState<File[]>([]);
    const [isProcessingSuppliers, setIsProcessingSuppliers] = useState(false);
    const [supplierProcessingError, setSupplierProcessingError] = useState("");
    const [supplierQuotations, setSupplierQuotations] = useState<SupplierQuotation[]>([]);

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return <FileText className="h-5 w-5 text-red-500" />;
            case 'doc':
            case 'docx':
                return <FileText className="h-5 w-5 text-blue-700" />;
            default:
                return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    const handleSupplierFileUpload = (file: File) => {
        setSupplierFiles(prev => [...prev, file]);
        setSupplierProcessingError("");
    };

    const handleRemoveSupplierFile = (index: number) => {
        setSupplierFiles(prev => prev.filter((_, i) => i !== index));
        setSupplierProcessingError("");
    };

    const processSupplierFiles = async () => {
        if (supplierFiles.length === 0) {
            setSupplierProcessingError("Por favor, adicione pelo menos um arquivo de cotação.");
            return;
        }

        if (!referenceData) {
            setSupplierProcessingError("É necessário processar a cotação de referência primeiro.");
            return;
        }

        setIsProcessingSuppliers(true);
        setSupplierProcessingError("");

        try {
            // Processar cada arquivo
            const supplierResults = await Promise.all(
                supplierFiles.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const uint8Array = new Uint8Array(buffer);

                    // Analisar o PDF do fornecedor
                    return await analyzeSupplierPDF(uint8Array, referenceData);
                })
            );

            setSupplierQuotations(supplierResults);

            // Processar comparação de todas as cotações
            const comparisonResults = await compareAllQuotations(referenceData, supplierResults);

            // Enviar resultados da comparação para o componente pai
            onComparisonResultsChange(comparisonResults);

        } catch (error) {
            console.error("Erro ao processar arquivos:", error);
            if (error instanceof Error) {
                setSupplierProcessingError(error.message);
            } else {
                setSupplierProcessingError("Erro ao processar os arquivos. Tente novamente.");
            }
        } finally {
            setIsProcessingSuppliers(false);
        }
    };

    const renderSupplierItems = (quotation: SupplierQuotation) => {
        return (
            <div className="mt-4 border rounded-md p-4 bg-card">
                <h4 className="text-sm font-medium mb-2">Fornecedor: {quotation.supplier}</h4>
                <div className="space-y-2">
                    {quotation.items.map((item, index) => (
                        <div key={index} className="p-3 border rounded-md bg-background">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">{item.description}</span>
                                <span className="text-sm font-bold">R$ {item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                {item.quantity && <span>Qtd: {item.quantity}</span>}
                                {item.manufacturer && <span>Fabricante: {item.manufacturer}</span>}
                                {item.matchConfidence && (
                                    <span className={`font-medium ${item.matchConfidence === "Alta" ? "text-green-600" :
                                            item.matchConfidence === "Média" ? "text-amber-600" : "text-red-600"
                                        }`}>
                                        Confiança: {item.matchConfidence}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <DropZone
                label="Clique ou arraste os arquivos de cotação dos fornecedores aqui"
                onFile={handleSupplierFileUpload}
                accept=".pdf"
            />

            {supplierFiles.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Arquivos adicionados ({supplierFiles.length})</h4>
                    <ul className="space-y-2">
                        {supplierFiles.map((file, index) => (
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
                                    onClick={() => handleRemoveSupplierFile(index)}
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
                            onClick={processSupplierFiles}
                            disabled={isProcessingSuppliers || supplierFiles.length === 0 || !referenceData}
                            className="w-full"
                        >
                            {isProcessingSuppliers ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : "Analisar cotações"}
                        </Button>

                        {supplierProcessingError && (
                            <p className="text-sm text-destructive mt-2">{supplierProcessingError}</p>
                        )}

                        {!referenceData && (
                            <p className="text-sm text-amber-600 mt-2">
                                É necessário processar a cotação de referência antes de analisar as cotações dos fornecedores.
                            </p>
                        )}
                    </div>

                    {supplierQuotations.length > 0 && (
                        <div className="mt-6 space-y-6">
                            <h3 className="text-base font-medium">Cotações analisadas</h3>
                            {supplierQuotations.map((quotation, index) => (
                                <div key={index}>
                                    {renderSupplierItems(quotation)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};