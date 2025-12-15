import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, Paperclip, MoreVertical, Trash2, Edit2, Save, X } from 'lucide-react';

const LessonPlans = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Mock Data
    const [plans, setPlans] = useState([
        { id: 1, title: 'Introduction to Algebra', date: '2025-12-16', class: 'Grade 10-A', content: 'algebra_intro.pdf', objectives: 'Understand variables and constants.' },
        { id: 2, title: 'Newton\'s Laws of Motion', date: '2025-12-18', class: 'Grade 11-B', content: 'physics_ch3.ppt', objectives: 'Explain the three laws of motion.' },
        { id: 3, title: 'Quadratic Equations', date: '2025-12-20', class: 'Grade 10-B', content: 'worksheet_4.docx', objectives: 'Solve quadratic equations by factoring.' },
    ]);

    const [formData, setFormData] = useState({
        title: '',
        class: 'Grade 10-A',
        date: '',
        objectives: '',
        content: ''
    });

    const handleStartCreate = () => {
        setFormData({ title: '', class: 'Grade 10-A', date: '', objectives: '', content: '' });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleStartEdit = (plan) => {
        setFormData({ ...plan });
        setIsCreating(true);
        setEditingId(plan.id);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingId) {
            setPlans(plans.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
            alert(`Lesson Plan "${formData.title}" updated successfully!`);
        } else {
            const newPlan = { ...formData, id: plans.length + 1, content: formData.content || 'new_file.pdf' };
            setPlans([...plans, newPlan]);
            alert(`Lesson Plan "${formData.title}" created successfully!`);
        }
        setIsCreating(false);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this lesson plan?')) {
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Lesson Plans</h1>
                    <p className="text-gray-600">Create and manage your daily lesson plans.</p>
                </div>
                <button
                    onClick={handleStartCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    New Lesson Plan
                </button>
            </header>

            {isCreating && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}</h2>
                    <form className="space-y-4" onSubmit={handleSave}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Photosynthesis"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For Class</label>
                                <select
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option>Grade 10-A</option>
                                    <option>Grade 10-B</option>
                                    <option>Grade 11-A</option>
                                    <option>Grade 11-B</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
                            <textarea
                                rows="3"
                                value={formData.objectives}
                                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Material</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <Paperclip className="mx-auto text-gray-400 mb-2" size={24} />
                                <p className="text-sm text-gray-500">Click to upload files or drag and drop</p>
                                <p className="text-xs text-gray-400">(PDF, PPTX, DOCX)</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <Save size={18} /> Save Plan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{plan.title}</h3>
                            <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={18} /></button>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} className="text-blue-500" />
                                <span>{plan.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen size={16} className="text-purple-500" />
                                <span>{plan.class}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Paperclip size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-600 truncate">{plan.content}</span>
                            </div>
                            <button className="text-xs text-blue-600 hover:underline flex-shrink-0">View</button>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => handleStartEdit(plan)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LessonPlans;
