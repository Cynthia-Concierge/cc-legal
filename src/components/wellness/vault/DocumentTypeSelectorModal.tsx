import React, { useState, useMemo } from 'react';
import { X, FileText, Search } from 'lucide-react';
import { Button } from '../../wellness/ui/Button';
import { UserAnswers } from '../../../types/wellness';
import { getRecommendedDocuments } from '../../../lib/wellness/documentEngine';
import { DocumentChecklistItem, TEMPLATE_TO_CHECKLIST } from './LegalInventoryChecklist';

interface DocumentTypeSelectorModalProps {
  isOpen: boolean;
  fileName: string;
  userAnswers: UserAnswers | null;
  onSelect: (documentType: string | null) => void;
  onCancel: () => void;
}

export const DocumentTypeSelectorModal: React.FC<DocumentTypeSelectorModalProps> = ({
  isOpen,
  fileName,
  userAnswers,
  onSelect,
  onCancel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Get recommended documents based on user's business type
  const recommendedDocs = useMemo(() => {
    if (!userAnswers) return { freeTemplates: [], advancedTemplates: [] };
    return getRecommendedDocuments(userAnswers);
  }, [userAnswers]);

  // Build list of available document types
  const availableTypes = useMemo(() => {
    const allDocs = [...recommendedDocs.freeTemplates, ...recommendedDocs.advancedTemplates];
    const types: Array<{ id: string; label: string; category: string }> = [];

    allDocs.forEach(doc => {
      const checklistMapping = TEMPLATE_TO_CHECKLIST[doc.id];
      if (checklistMapping) {
        types.push({
          id: doc.id,
          label: checklistMapping.label,
          category: checklistMapping.category,
        });
      }
    });

    // Add insurance (not in templates but should be available)
    types.push({
      id: 'insurance',
      label: 'Insurance Certificates',
      category: 'advanced',
    });

    // Remove duplicates
    const unique = Array.from(new Map(types.map(t => [t.id, t])).values());
    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, [recommendedDocs]);

  // Filter by search query
  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return availableTypes;
    const query = searchQuery.toLowerCase();
    return availableTypes.filter(type =>
      type.label.toLowerCase().includes(query) ||
      type.category.toLowerCase().includes(query)
    );
  }, [availableTypes, searchQuery]);

  // Group by category
  const groupedTypes = useMemo(() => {
    const groups: Record<string, typeof filteredTypes> = {};
    filteredTypes.forEach(type => {
      if (!groups[type.category]) {
        groups[type.category] = [];
      }
      groups[type.category].push(type);
    });
    return groups;
  }, [filteredTypes]);

  const categoryLabels: Record<string, string> = {
    core: 'Core Business Documents',
    website: 'Website Compliance',
    marketing: 'Marketing & Media',
    studio: 'Studio-Specific',
    retreat: 'Retreat-Specific',
    advanced: 'Advanced / Situational',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">What type of document is this?</h2>
            <p className="text-sm text-slate-500 mt-1">File: {fileName}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search document types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTypes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No document types found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTypes).map(([category, types]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {types.map(type => (
                      <button
                        key={type.id}
                        onClick={() => onSelect(type.id)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 group-hover:text-brand-700">
                            {type.label}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => onSelect(null)}
            className="text-slate-500"
          >
            Skip (I'll categorize later)
          </Button>
        </div>
      </div>
    </div>
  );
};

