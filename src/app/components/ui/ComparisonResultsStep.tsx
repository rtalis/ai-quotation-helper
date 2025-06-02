"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/utils/excelExport";
import { ComparisonResult } from "@/app/types";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  BarChart3,
  TrendingDown,
  Award
} from "lucide-react";

interface ComparisonResultsStepProps {
  comparisonResults: ComparisonResult | null;
}

export const ComparisonResultsStep: React.FC<ComparisonResultsStepProps> = ({
  comparisonResults
}) => {
  // Estado para controlar quais linhas estão expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Função para alternar a expansão de uma linha
  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleExportReport = () => {
    if (comparisonResults) {
      exportToExcel(comparisonResults);
    }
  };

  // Função para calcular a classe CSS baseada na porcentagem de economia
  const getSavingsClass = (savings: number) => {
    if (savings <= 0) return "text-red-500";
    if (savings < 0.1) return "text-amber-500";
    return "text-green-600";
  };

  // Função para formatar a porcentagem
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!comparisonResults) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum resultado disponível. Processe as cotações nas etapas anteriores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-md bg-card shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Economia Total</h3>
            <TrendingDown className="h-5 w-5 text-green-600" />
          </div>
          <p className={`text-2xl font-bold ${getSavingsClass(comparisonResults.totalSavings)}`}>
            {formatPercentage(comparisonResults.totalSavings)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Economia de R$ {(comparisonResults.totalOriginal - comparisonResults.totalBest).toFixed(2)}
          </p>
        </div>
        
        <div className="p-4 border rounded-md bg-card shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Melhor Valor</h3>
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold">
            R$ {comparisonResults.totalBest.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Valor original: R$ {comparisonResults.totalOriginal.toFixed(2)}
          </p>
        </div>
        
        <div className="p-4 border rounded-md bg-card shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Fornecedores</h3>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">
            {Object.keys(comparisonResults.supplierTotals).length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {comparisonResults.items.length} itens comparados
          </p>
        </div>
      </div>
      
      <Table className="border rounded-md">
        <TableCaption>Comparativo de preços entre fornecedores</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Preço Original</TableHead>
            <TableHead>Melhor Preço</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Economia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparisonResults.items.map((item, index) => (
            <React.Fragment key={index}>
              <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(`item-${index}`)}>
                <TableCell>
                  {expandedRows[`item-${index}`] ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell>{item.quantity} {item.unit}</TableCell>
                <TableCell>R$ {item.originalPrice.toFixed(2)}</TableCell>
                <TableCell className="font-medium">R$ {item.bestPrice.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {item.supplier}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      item.matchConfidence === "Alta" ? "bg-green-100 text-green-800" : 
                      item.matchConfidence === "Média" ? "bg-amber-100 text-amber-800" : 
                      "bg-red-100 text-red-800"
                    }`}>
                      {item.matchConfidence}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={getSavingsClass(item.savings)}>
                  {formatPercentage(item.savings)}
                </TableCell>
              </TableRow>
              
              {/* Detalhes expandidos */}
              {expandedRows[`item-${index}`] && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={7} className="p-0">
                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-2">Todas as cotações para este item:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Preço Unit.</TableHead>
                            <TableHead>Preço Total</TableHead>
                            <TableHead>Fabricante</TableHead>
                            <TableHead>Confiança</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.allQuotes.map((quote, quoteIndex) => (
                            <TableRow key={quoteIndex} className={
                              quote.supplier === item.supplier ? "bg-primary/10" : ""
                            }>
                              <TableCell>{quote.supplier}</TableCell>
                              <TableCell>R$ {quote.price.toFixed(2)}</TableCell>
                              <TableCell>R$ {quote.totalPrice.toFixed(2)}</TableCell>
                              <TableCell>{quote.manufacturer}</TableCell>
                              <TableCell>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  quote.matchConfidence === "Alta" ? "bg-green-100 text-green-800" : 
                                  quote.matchConfidence === "Média" ? "bg-amber-100 text-amber-800" : 
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {quote.matchConfidence}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Resumo por Fornecedor</h3>
        <Button 
  variant="outline" 
  className="flex items-center gap-2"
  onClick={handleExportReport}
>
  <Download className="h-4 w-4" />
  Exportar Relatório
</Button>
      </div>
      
      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Itens com Melhor Preço</TableHead>
            <TableHead>Proporção do Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(comparisonResults.supplierTotals).map(([supplier, total], index) => {
            const itemsWon = comparisonResults.items.filter(item => item.supplier === supplier).length;
            const proportion = total / comparisonResults.totalBest;
            
            return (
              <TableRow key={index}>
                <TableCell className="font-medium">{supplier}</TableCell>
                <TableCell>R$ {Number(total).toFixed(2)}</TableCell>
                <TableCell>{itemsWon} de {comparisonResults.items.length}</TableCell>
                <TableCell>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${proportion * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(proportion * 100).toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};