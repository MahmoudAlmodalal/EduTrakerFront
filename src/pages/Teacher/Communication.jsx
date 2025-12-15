import React, { useState } from 'react';
import { Mail, MessageSquare, Search, Send, User, Bell, X } from 'lucide-react';

const Communication = () => {
    const [selectedTab, setSelectedTab] = useState('messages'); // 'messages', 'notifications'
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [replyText, setReplyText] = useState('');

    // Mock Messages Data
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'Parent: Mr. Ahmed',
            subject: 'Regarding Ahmed\'s grades',
            preview: 'I would like to discuss the recent math test results...',
            date: '10:30 AM',
            unread: true,
            thread: [
                { id: 101, from: 'Parent: Mr. Ahmed', text: 'Dear Mr. Teacher, I would like to discuss the recent math test results. Can we meet?', time: '10:30 AM' }
            ]
        },
        {
            id: 2,
            sender: 'Admin: Principal Office',
            subject: 'Staff Meeting Reminder',
            preview: 'Please remember that we have a staff meeting today at...',
            date: 'Yesterday',
            unread: false,
            thread: [
                { id: 201, from: 'Admin: Principal Office', text: 'Please remember that we have a staff meeting today at 2 PM in the main hall.', time: 'Yesterday 9:00 AM' }
            ]
        },
        {
            id: 3,
            sender: 'Student: Sara Khan',
            subject: 'Question about Homework',
            preview: 'Can you please explain the last question in the worksheet?',
            date: 'Dec 12',
            unread: false,
            thread: [
                { id: 301, from: 'Student: Sara Khan', text: 'Can you please explain the last question in the worksheet? I am stuck.', time: 'Dec 12 4:00 PM' }
            ]
        },
    ]);

    // New Message Form State
    const [newMessage, setNewMessage] = useState({ to: '', subject: '', body: '' });

    const handleSendMessage = (e) => {
        e.preventDefault();
        const newMsg = {
            id: messages.length + 1,
            sender: 'Me',
            subject: newMessage.subject,
            preview: newMessage.body,
            date: 'Just now',
            unread: false,
            thread: [
                { id: Date.now(), from: 'Me', text: newMessage.body, time: 'Just now' }
            ]
        };
        // In a real app, this would go to an outbox or separate list, but here we just add to list for demo
        // Actually, usually "Messages" are inbox, so let's simulate sending adding to inbox just to show it creates something
        setMessages([newMsg, ...messages]);
        setIsComposing(false);
        setNewMessage({ to: '', subject: '', body: '' });
        alert('Message sent successfully!');
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        const updatedMessages = messages.map(msg => {
            if (msg.id === selectedMessage.id) {
                const newThread = [
                    ...msg.thread,
                    { id: Date.now(), from: 'Me', text: replyText, time: 'Just now' }
                ];
                const updatedMsg = { ...msg, thread: newThread };
                setSelectedMessage(updatedMsg); // Update selected view
                return updatedMsg;
            }
            return msg;
        });

        setMessages(updatedMessages);
        setReplyText('');
    };

    return (
        <div className="p-6 h-[calc(100vh-80px)] flex flex-col relative">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Communication Center</h1>
                    <p className="text-gray-600">Stay connected with students, parents, and administration.</p>
                </div>
                <button
                    onClick={() => setIsComposing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Send size={18} /> Compose New
                </button>
            </header>

            {isComposing && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 animate-fade-in relative">
                        <button
                            onClick={() => setIsComposing(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 mb-6">New Message</h2>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <select
                                    required
                                    value={newMessage.to}
                                    onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Recipient...</option>
                                    <option value="Parent: Mr. Ahmed">Parent: Mr. Ahmed</option>
                                    <option value="Student: Sara Khan">Student: Sara Khan</option>
                                    <option value="Admin: Principal Office">Admin: Principal Office</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows="5"
                                    value={newMessage.body}
                                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                    <Send size={18} /> Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
                {/* Sidebar List */}
                <div className="w-1/3 border-r border-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 transition-shadow"
                            />
                        </div>
                        <div className="flex mt-4 p-1 bg-gray-50 rounded-lg">
                            <button
                                onClick={() => setSelectedTab('messages')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${selectedTab === 'messages' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Messages
                            </button>
                            <button
                                onClick={() => setSelectedTab('notifications')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${selectedTab === 'notifications' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Notifications
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-sm font-semibold truncate ${msg.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {msg.sender}
                                    </h3>
                                    <span className="text-xs text-gray-400 nowrap">{msg.date}</span>
                                </div>
                                <p className={`text-sm mb-1 truncate ${msg.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                    {msg.subject}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{msg.preview}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail View */}
                <div className="flex-1 flex flex-col bg-gray-50/50">
                    {selectedMessage ? (
                        <>
                            <div className="p-6 bg-white border-b border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800">{selectedMessage.subject}</h2>
                                            <p className="text-sm text-gray-600">From: <span className="font-medium">{selectedMessage.sender}</span></p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{selectedMessage.date}</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                                {selectedMessage.thread && selectedMessage.thread.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.from === 'Me' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-xl ${msg.from === 'Me' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 mt-1">{msg.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-500">Select a message to view</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
