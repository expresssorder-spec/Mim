import React, { useState, useRef } from 'react';
import { Rule } from '../types';
import { Plus, Trash2, Edit2, Check, X, Save, Bot, Upload, FileText, FileSpreadsheet, Info } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface RuleManagerProps {
  rules: Rule[];
  onAddRule: (rule: Omit<Rule, 'id'>) => void;
  onAddRules: (rules: Omit<Rule, 'id'>[]) => void;
  onUpdateRule: (rule: Rule) => void;
  onDeleteRule: (id: string) => void;
}

export const RuleManager: React.FC<RuleManagerProps> = ({ rules, onAddRule, onAddRules, onUpdateRule, onDeleteRule }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [keywords, setKeywords] = useState('');
  const [response, setResponse] = useState('');

  const resetForm = () => {
    setKeywords('');
    setResponse('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!keywords.trim() || !response.trim()) return;

    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (editingId) {
      const existingRule = rules.find(r => r.id === editingId);
      if (existingRule) {
        onUpdateRule({
          ...existingRule,
          keywords: keywordArray,
          response: response,
        });
      }
    } else {
      onAddRule({
        keywords: keywordArray,
        response: response,
        isActive: true,
      });
    }
    resetForm();
  };

  const startEdit = (rule: Rule) => {
    setKeywords(rule.keywords.join(', '));
    setResponse(rule.response);
    setEditingId(rule.id);
    setIsAdding(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // --- Smart Import Logic ---
  const detectColumns = (headerRow: any[]) => {
      const lowerHeaders = headerRow.map(h => String(h || '').toLowerCase().trim());
      
      // Multilingual support for headers
      const keywordTerms = ['keyword', 'key', 'trigger', 'message', 'input', 'question', 'mot', 'mot-cle', 'kalima', 'sual', 'كلمة', 'مفتاح', 'سؤال'];
      const responseTerms = ['response', 'reply', 'answer', 'output', 'jawab', 'rad', 'rep', 'reponse', 'جواب', 'رد'];

      let kIndex = -1;
      let rIndex = -1;

      // Find best match
      lowerHeaders.forEach((h, idx) => {
          if (keywordTerms.some(t => h.includes(t))) kIndex = idx;
          if (responseTerms.some(t => h.includes(t))) rIndex = idx;
      });

      return { kIndex, rIndex };
  };

  const processImportedData = (data: any[][]) => {
      if (!data || data.length === 0) return;

      const newRules: Omit<Rule, 'id'>[] = [];
      let startIndex = 0;
      let keywordColIndex = 0;
      let responseColIndex = 1;

      // 1. Try to detect headers in the first row
      const firstRow = data[0];
      const { kIndex, rIndex } = detectColumns(firstRow);

      if (kIndex !== -1 && rIndex !== -1 && kIndex !== rIndex) {
          // Headers found!
          keywordColIndex = kIndex;
          responseColIndex = rIndex;
          startIndex = 1; // Skip header row
          console.log(`Smart Import: Detected Keywords at Col ${kIndex}, Responses at Col ${rIndex}`);
      } else {
          // Fallback: Assume Col 0 is Keywords, Col 1 is Response
          console.log("Smart Import: No headers detected, using default (0=Key, 1=Resp)");
      }

      // 2. Process rows
      for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;

          const rawKeywords = row[keywordColIndex];
          const rawResponse = row[responseColIndex];

          if (rawKeywords && rawResponse) {
               // Handle comma separated keywords or newlines
               const keywordString = String(rawKeywords);
               const keywordArray = keywordString
                    .split(/[,;\n]/) // Split by comma, semicolon or newline
                    .map(k => k.trim())
                    .filter(k => k.length > 0);

               const responseString = String(rawResponse).trim();

               if (keywordArray.length > 0 && responseString.length > 0) {
                 newRules.push({
                   keywords: keywordArray,
                   response: responseString,
                   isActive: true
                 });
               }
          }
      }

      if (newRules.length > 0) {
          onAddRules(newRules);
          alert(`Successfully imported ${newRules.length} rules!`);
      } else {
          alert("No valid rules found in the file.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
        Papa.parse(file, {
          complete: (results: any) => {
            processImportedData(results.data);
          },
          header: false // We parse as array of arrays to handle headers manually
        });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // header: 1 results in an array of arrays [["key", "val"], ["key", "val"]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            processImportedData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Unsupported file format. Please use CSV or Excel (.xlsx, .xls)");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Automation Rules</h2>
          <p className="text-xs text-gray-500">If message contains keyword, send response.</p>
        </div>
        {!isAdding && (
          <div className="flex gap-2">
             <input 
               type="file" 
               accept=".csv, .xlsx, .xls" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileUpload}
             />
             <button
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              title="Smart Import: Auto-detects columns from headers"
            >
              <FileSpreadsheet size={16} /> Import Excel/CSV
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> New Rule
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isAdding && (
          <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">
              {editingId ? 'Edit Rule' : 'New Auto-Reply Rule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-700 mb-1">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. price, cost, how much, taman"
                  className="w-full p-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-indigo-700 mb-1">Bot Response</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="e.g. The price is $50 plus shipping."
                  rows={3}
                  className="w-full p-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-1"
                >
                  <Save size={14} /> Save Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {rules.length === 0 && !isAdding ? (
          <div className="text-center py-10 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot size={32} className="opacity-50" />
            </div>
            <p>No rules defined yet.</p>
            <p className="text-sm mt-1">Add keywords manually or import a file.</p>
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-xs inline-block text-left max-w-sm border border-blue-100">
                <div className="flex items-center gap-2 font-bold mb-2">
                   <Info size={14} /> Smart Import Supported
                </div>
                <p className="mb-2">Upload any Excel or CSV file. The system automatically detects columns if you use headers like:</p>
                <ul className="list-disc pl-4 space-y-1 opacity-80">
                    <li><strong>Keywords:</strong> Key, Mot, Question, Kalima, Sual...</li>
                    <li><strong>Response:</strong> Reply, Answer, Jawab, Rad, Reponse...</li>
                </ul>
                <p className="mt-2 text-[10px] text-blue-600 opacity-70">If no headers are found, Column 1 is Keywords, Column 2 is Response.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`group border rounded-lg p-4 transition-all hover:shadow-md ${
                  rule.id === editingId ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rule.keywords.map((k, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                          {k}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                      "{rule.response}"
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};