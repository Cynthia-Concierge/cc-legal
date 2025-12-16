import React from 'react';
import { DocumentVault } from '../../../components/wellness/vault/DocumentVault';
import { Shield } from 'lucide-react';

export const DashboardVault: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Your Documents</h1>
                <p className="text-sm md:text-base text-slate-600">All the documents you need to protect your business.</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Only you have access to these files. We use enterprise-grade encryption to keep your documents safe.
                        </p>
                    </div>
                </div>
            </div>

            <DocumentVault />
        </div>
    );
};
