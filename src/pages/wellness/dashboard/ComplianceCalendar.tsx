import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/wellness/ui/Card';
import { Button } from '../../../components/wellness/ui/Button';

// Mock data for prototype
const DEFAULT_TASKS = [
    { id: 1, title: 'Annual LLC Renewal', date: '2025-04-15', status: 'pending', priority: 'high' },
    { id: 2, title: 'Liability Insurance Renewal', date: '2025-06-01', status: 'pending', priority: 'medium' },
    { id: 3, title: 'Review Independent Contractor Agreements', date: '2025-01-20', status: 'overdue', priority: 'medium' },
];

export const ComplianceCalendar: React.FC = () => {
    const [tasks, setTasks] = useState(DEFAULT_TASKS);

    const handleComplete = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    };

    const getStatusColor = (status: string, date: string) => {
        if (status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (new Date(date) < new Date() && status !== 'completed') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-white border-slate-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Compliance Calendar</h1>
                    <p className="text-slate-600">Stay ahead of important legal deadlines and renewals.</p>
                </div>
                <Button variant="outline" size="sm">
                    <Plus size={16} className="mr-2" /> Add Reminder
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Summary Cards */}
                <Card className="bg-gradient-to-br from-brand-500 to-brand-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-brand-100 text-sm font-medium">Next Deadline</p>
                                <h3 className="text-2xl font-bold mt-1">Jan 20</h3>
                                <p className="text-sm mt-1 opacity-90">Review Contractor Agreements</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Clock className="text-white" size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm font-medium text-slate-500">Compliance Score</div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">85%</span>
                            <span className="text-sm text-emerald-600 font-medium">+5% last month</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
                            <div className="bg-brand-500 h-full w-[85%]"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon size={20} className="text-brand-600" />
                        Upcoming Deadlines
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${getStatusColor(task.status, task.date)}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${task.status === 'completed' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                  `}>
                                        {task.status === 'completed' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-semibold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                            {task.title}
                                        </h4>
                                        <p className="text-sm text-slate-500">
                                            Due: {new Date(task.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {task.status !== 'completed' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="hover:bg-emerald-50 hover:text-emerald-700"
                                        onClick={() => handleComplete(task.id)}
                                    >
                                        Mark Done
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
