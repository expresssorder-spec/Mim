import React, { useState, useEffect } from 'react';
import { Rule, Message, StoreSettings, User, UserRole, UserMetadata, UserStats } from './types';
import { ChatSimulator } from './components/ChatSimulator';
import { RuleManager } from './components/RuleManager';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { generateSmartReply } from './services/geminiService';
import { MessageSquare, Settings, Sparkles, AlertCircle, ShoppingBag, Wifi, WifiOff, Smartphone, Copy, X, Loader2, LogOut, User as UserIcon, MapPin } from 'lucide-react';

const DEFAULT_RULES: Rule[] = [
  { id: '1', keywords: ['prix', 'price', 'taman', 'bach'], response: 'The price for this item is 299 DH. Free shipping on orders over 500 DH!', isActive: true },
  { id: '2', keywords: ['hello', 'salam', 'hi', 'holla'], response: 'Salam! Welcome to our store. How can I help you today?', isActive: true },
  { id: '3', keywords: ['livraison', 'shipping', 'tawsil'], response: 'We deliver to all cities in Morocco within 24-48 hours.', isActive: true },
];

const DEFAULT_SETTINGS: StoreSettings = {
    storeName: 'My Awesome Store',
    aiPersona: 'You are a helpful and polite sales assistant speaking Darija, French or English depending on the user.',
    useAiFallback: true,
};

// Simulated Random Data Generators
const generateMetadata = (): UserMetadata => {
    const countries = ['Morocco', 'Morocco', 'Morocco', 'France', 'UAE', 'Saudi Arabia'];
    const randomIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    // Simulate a Mac Address / Device ID
    const randomMac = "XX:XX:XX:XX:XX:XX".replace(/X/g, function() {
        return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
    });
    
    return {
        country: countries[Math.floor(Math.random() * countries.length)],
        ipAddress: randomIp,
        deviceId: randomMac
    };
};

const App: React.FC = () => {
  // --- Auth & User Management State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [authError, setAuthError] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'rules' | 'settings'>('rules');

  // Load users from LocalStorage on mount
  useEffect(() => {
    const storedUsers = localStorage.getItem('autoresponda_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
        // Initialize Default Admin if no users exist
        const adminUser: User = {
            id: 'admin_01',
            role: 'admin',
            email: 'admin@autoresponda.com',
            password: 'admin123', // Hardcoded for demo
            phoneNumber: null,
            isConnected: false,
            rules: [],
            settings: DEFAULT_SETTINGS,
            createdAt: new Date(),
            stats: { messagesAnswered: 0, lastActive: new Date() },
            metadata: { country: 'System', ipAddress: '127.0.0.1', deviceId: 'ADMIN-CONSOLE' },
            isBlocked: false
        };
        setUsers([adminUser]);
    }
  }, []);

  // Sync users to LocalStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
        localStorage.setItem('autoresponda_users', JSON.stringify(users));
    }
  }, [users]);

  // --- Auth Handlers ---
  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      if (user.isBlocked) {
          setAuthError(`Access Denied: This device ID (${user.metadata.deviceId}) has been banned by the administrator.`);
          return;
      }

      setCurrentUser(user);
      setAuthError(undefined);
      // Reset Chat for fresh session view
      setMessages([{ id: 'welcome', text: `Salam! Connected to ${user.settings.storeName}. Test your bot now.`, sender: 'bot', timestamp: new Date() }]);
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleRegister = (email: string, pass: string) => {
    if (users.find(u => u.email === email)) {
      setAuthError('User already exists with this email.');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      role: 'user',
      email,
      password: pass,
      phoneNumber: null,
      isConnected: false,
      rules: DEFAULT_RULES,
      settings: DEFAULT_SETTINGS,
      createdAt: new Date(),
      stats: { messagesAnswered: 0, lastActive: new Date() },
      metadata: generateMetadata(),
      isBlocked: false
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setAuthError(undefined);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(undefined);
  };

  const handleToggleBlock = (userId: string) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, isBlocked: !u.isBlocked };
          }
          return u;
      }));
  };

  // --- Data Update Helpers (Updates Current User & Database) ---
  const updateUserData = (updates: Partial<User>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const incrementMessageStats = () => {
      if(!currentUser) return;
      const newStats = {
          ...currentUser.stats,
          messagesAnswered: (currentUser.stats?.messagesAnswered || 0) + 1
      };
      updateUserData({ stats: newStats });
  };


  // --- Chat State (Local to session, not persisted in DB for simulator) ---
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', text: 'Salam! Write a message to test the bot.', sender: 'bot', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // --- Connection Modal State ---
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectStep, setConnectStep] = useState<'input' | 'loading' | 'code' | 'success'>('input');
  const [tempPhoneNumber, setTempPhoneNumber] = useState('+212 ');
  const [pairingCode, setPairingCode] = useState('');

  // --- Core Logic ---

  const generatePairingCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.match(/.{1,4}/g)?.join('-') || 'CODE-ERR';
  };

  const handleGetCode = () => {
    if (tempPhoneNumber.length < 10) return;
    setConnectStep('loading');
    setTimeout(() => {
        setPairingCode(generatePairingCode());
        setConnectStep('code');
    }, 1500);
  };

  const handleConfirmConnection = () => {
    setConnectStep('success');
    setTimeout(() => {
        // Update User Account with Phone Number and Connection Status
        updateUserData({
            isConnected: true,
            phoneNumber: tempPhoneNumber
        });
        
        setShowConnectModal(false);
        setConnectStep('input');
        setMessages([{ id: 'connected', text: '🟢 Bot Connected successfully! I am now online.', sender: 'bot', timestamp: new Date() }]);
    }, 1500);
  };

  const handleDisconnect = () => {
      updateUserData({
          isConnected: false,
          // We keep the phone number saved, just disconnected status
      });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !currentUser.isConnected) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Simulate Delay
    setTimeout(async () => {
      let responseText = '';
      let isAi = false;

      // 3. Keyword Matching (Using Current User's Rules)
      const normalizedText = text.toLowerCase();
      const matchedRule = currentUser.rules.find(rule => 
        rule.isActive && rule.keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))
      );

      if (matchedRule) {
        responseText = matchedRule.response;
      } else if (currentUser.settings.useAiFallback) {
        // 4. AI Fallback (Using Current User's Settings)
        responseText = await generateSmartReply(text, currentUser.settings, currentUser.rules);
        isAi = true;
      } else {
        responseText = "Sorry, I didn't understand that. Please contact support.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        isAiGenerated: isAi
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      // Track stats
      incrementMessageStats();

    }, 1500); 
  };

  // --- Rule CRUD Wrappers ---
  const addRule = (newRule: Omit<Rule, 'id'>) => {
    if (!currentUser) return;
    const ruleWithId = { ...newRule, id: Date.now().toString() };
    updateUserData({ rules: [...currentUser.rules, ruleWithId] });
  };

  // Bulk add to avoid state overwrite issues during loop
  const addRules = (newRules: Omit<Rule, 'id'>[]) => {
      if (!currentUser) return;
      const timestamp = Date.now();
      const rulesWithIds = newRules.map((r, idx) => ({
          ...r,
          id: `${timestamp}-${idx}`
      }));
      updateUserData({ rules: [...currentUser.rules, ...rulesWithIds] });
  };

  const updateRule = (updatedRule: Rule) => {
    if (!currentUser) return;
    updateUserData({ 
        rules: currentUser.rules.map(r => r.id === updatedRule.id ? updatedRule : r) 
    });
  };

  const deleteRule = (id: string) => {
    if (!currentUser) return;
    updateUserData({ 
        rules: currentUser.rules.filter(r => r.id !== id) 
    });
  };

  // --- Render Condition ---
  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} error={authError} />;
  }

  // --- ADMIN VIEW ---
  if (currentUser.role === 'admin') {
      return <AdminDashboard users={users} onToggleBlock={handleToggleBlock} onLogout={handleLogout} />;
  }

  // --- USER VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-inter">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">AutoResponda</h1>
              <span className="text-[10px] text-slate-400">Business Edition</span>
          </div>
        </div>
        
        {/* User Profile Mini */}
        <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <UserIcon size={14} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-200 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.settings.storeName}</p>
                </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                <MapPin size={10} /> {currentUser.metadata?.country}
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ShoppingBag size={18} />
            <span>Rules & Keywords</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} />
            <span>Bot Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
            {/* Connection Status Box */}
           <div className={`rounded-lg p-3 text-xs border ${currentUser.isConnected ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
             <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">WhatsApp Status</span>
                {currentUser.isConnected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
             </div>
             
             {currentUser.isConnected ? (
                 <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-1.5 text-green-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {currentUser.phoneNumber}
                     </div>
                     <button 
                        onClick={handleDisconnect}
                        className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                     >
                        Disconnect
                     </button>
                 </div>
             ) : (
                 <div className="flex flex-col gap-2">
                    <span className="text-red-400 font-medium">● Offline</span>
                    <button 
                        onClick={() => setShowConnectModal(true)}
                        className="w-full py-2 px-2 bg-green-600 hover:bg-green-500 text-white rounded text-[10px] font-bold shadow-md transition-colors flex items-center justify-center gap-1"
                    >
                        <Smartphone size={12} /> Link WhatsApp
                    </button>
                 </div>
             )}
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-xs font-medium hover:bg-slate-800 rounded transition-colors"
           >
               <LogOut size={14} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row gap-8">
          
          {/* Left Panel: Configuration */}
          <div className="flex-1 h-full min-h-[500px]">
            {activeTab === 'rules' ? (
              <RuleManager 
                rules={currentUser.rules} 
                onAddRule={addRule} 
                onAddRules={addRules}
                onUpdateRule={updateRule} 
                onDeleteRule={deleteRule} 
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Settings size={20} /> Store Configuration
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                        <input 
                            type="text" 
                            value={currentUser.settings.storeName}
                            onChange={(e) => updateUserData({ settings: { ...currentUser.settings, storeName: e.target.value } })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 font-medium text-indigo-900 cursor-pointer">
                                <Sparkles size={16} className="text-indigo-600" />
                                Enable AI Fallback
                            </label>
                            <div 
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${currentUser.settings.useAiFallback ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                onClick={() => updateUserData({ settings: { ...currentUser.settings, useAiFallback: !currentUser.settings.useAiFallback } })}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${currentUser.settings.useAiFallback ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                        <p className="text-sm text-indigo-700 mb-4">
                            When enabled, if a user message doesn't match any keyword, Gemini AI will generate a response based on the persona below.
                        </p>

                         <div>
                            <label className="block text-sm font-medium text-indigo-900 mb-2">AI Persona & Instructions</label>
                            <textarea 
                                value={currentUser.settings.aiPersona}
                                onChange={(e) => updateUserData({ settings: { ...currentUser.settings, aiPersona: e.target.value } })}
                                rows={4}
                                className="w-full border border-indigo-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Simulator */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Live Preview</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setMessages([{ id: 'reset', text: 'Salam! Write a message to test the bot.', sender: 'bot', timestamp: new Date() }])}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 bg-slate-100 rounded"
                    >
                        Reset Chat
                    </button>
                </div>
            </div>
            <ChatSimulator 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isTyping={isTyping} 
                isConnected={currentUser.isConnected}
            />
          </div>
        </div>

        {/* Connection Modal */}
        {showConnectModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-[#075E54] p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Smartphone size={20} /> Link Device
                        </h3>
                        <button onClick={() => setShowConnectModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                    </div>
                    
                    <div className="p-6">
                        {connectStep === 'input' && (
                            <div className="space-y-4">
                                <div className="text-center mb-6">
                                    <h4 className="font-bold text-gray-800 text-lg mb-2">Enter phone number</h4>
                                    <p className="text-sm text-gray-500">Select the country code and enter your WhatsApp phone number.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Phone Number</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={tempPhoneNumber}
                                            onChange={(e) => setTempPhoneNumber(e.target.value)}
                                            className="w-full text-lg p-3 border-b-2 border-[#00897b] focus:outline-none bg-gray-50 rounded-t-md font-mono"
                                            placeholder="+212 600000000"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGetCode}
                                    className="w-full bg-[#00897b] text-white py-3 rounded-full font-bold shadow-lg hover:bg-[#007c6f] transition-all transform active:scale-95 mt-4"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {connectStep === 'loading' && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 size={40} className="text-[#00897b] animate-spin mb-4" />
                                <p className="text-gray-600 font-medium">Generating pairing code...</p>
                            </div>
                        )}

                        {connectStep === 'code' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h4 className="font-bold text-gray-800 mb-1">Enter code on your phone</h4>
                                    <p className="text-xs text-gray-500 px-4">
                                        Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link a Device &gt; Link with phone number instead.
                                    </p>
                                </div>

                                <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 text-center relative group">
                                    <div className="text-3xl font-mono font-bold tracking-widest text-gray-800 break-words">
                                        {pairingCode}
                                    </div>
                                    <button 
                                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-[#00897b] opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigator.clipboard.writeText(pairingCode)}
                                        title="Copy Code"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 flex gap-2 items-start">
                                    <Smartphone size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>Do not close this window until the device is linked on your phone.</span>
                                </div>

                                <button 
                                    onClick={handleConfirmConnection}
                                    className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-full font-bold hover:border-[#00897b] hover:text-[#00897b] transition-colors"
                                >
                                    I have entered the code
                                </button>
                            </div>
                        )}

                        {connectStep === 'success' && (
                             <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 animate-bounce">
                                    <Wifi size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800">Connected!</h4>
                                <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;