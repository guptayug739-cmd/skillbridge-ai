import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../hooks/useAppSelector';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Send, Paperclip, User, ChevronLeft, MessageSquare } from 'lucide-react';

let socket: Socket | null = null;

export default function Chat() {
  const { contractId } = useParams();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const [contracts, setContracts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [activeContract, setActiveContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket && accessToken) {
      socket = io('/', { auth: { token: accessToken } });
      socket.on('message', (msg: any) => {
        setMessages((prev) => [...prev, msg]);
      });
      socket.on('connect_error', () => {});
    }
    return () => {};
  }, [accessToken]);

  useEffect(() => {
    api.get('/chat/contracts').then((res) => {
      setContracts(res.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (contractId) {
      api.get(`/chat/${contractId}/messages`).then((res) => {
        setMessages(res.data.data);
        const active = contracts.find((c: any) => c.id === contractId);
        if (active) setActiveContract(active);
        api.put(`/chat/${contractId}/read`).catch(() => {});
        if (socket) socket.emit('join_contract', contractId);
      });
    }
  }, [contractId, contracts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !contractId) return;
    try {
      await api.post(`/chat/${contractId}/messages`, { content });
      setContent('');
    } catch { toast.error('Failed to send message'); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-8rem)] animate-fade-in">
      <div className="flex h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
        <div className="w-80 bg-white flex flex-col border-r border-gray-100 hidden md:flex">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" /> Messages
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {contracts.map((contract: any) => (
              <Link key={contract.id} to={`/chat/${contract.id}`}
                className={`flex items-center p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors ${contractId === contract.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {user?.role === 'FREELANCER' ? contract.client?.user?.name : contract.freelancer?.user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{contract.project?.title}</p>
                </div>
                {contract.unreadCount > 0 && (
                  <span className="bg-brand-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center ml-2 px-1">
                    {contract.unreadCount}
                  </span>
                )}
              </Link>
            ))}
            {contracts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {contractId ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center bg-white">
              <Link to="/chat" className="md:hidden mr-3 text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mr-3 md:hidden">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{user?.role === 'FREELANCER' ? activeContract?.client?.user?.name : activeContract?.freelancer?.user?.name}</p>
                <p className="text-xs text-gray-400">{activeContract?.project?.title}</p>
              </div>
              <span className={`badge text-xs ${activeContract?.status === 'ACTIVE' ? 'badge-success' : 'badge-primary'}`}>{activeContract?.status}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-thin">
              {messages.map((msg: any) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[75%] ${isMine ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/20' : 'bg-white text-gray-900 border border-gray-100 shadow-sm'} rounded-2xl px-4 py-2.5`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="text" value={content} onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..." className="input-field flex-1 bg-gray-50 border-gray-200 focus:bg-white" />
                <button onClick={handleSend} disabled={!content.trim()} className="btn-primary p-3">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-50/50 flex items-center justify-center">
            <div className="text-center text-gray-400 animate-fade-up">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
