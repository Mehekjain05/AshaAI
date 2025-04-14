import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types
type Message = {
    id: string; // Changed to string for UUID
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

type Conversation = {
    id: string; // Changed to string for UUID
    title: string;
    messages: Message[];
    model: string; // Model associated with this conversation
    lastUpdated: Date;
};

type ConversationGroup = {
    title: string;
    conversations: Conversation[];
};

// Context
type ConversationsContextType = {
    conversations: ConversationGroup[];
    setConversations: React.Dispatch<React.SetStateAction<ConversationGroup[]>>;
    currentConversation: Conversation | null;
    setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    addConversation: (conversation: Conversation) => void;
    updateConversationMessages: (id: string, messages: Message[]) => void;
    // Function to get the currently selected conversation (useful for async updates)
    getCurrentConversation: () => Conversation | null;
};

const ConversationsContext = React.createContext<ConversationsContextType | undefined>(undefined);

export const useConversations = () => {
    const context = React.useContext(ConversationsContext);
    if (context === undefined) {
        throw new Error('useConversations must be used within a ConversationsProvider');
    }
    return context;
};

// Message List Component
const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
    return (
        <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
                <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-lg py-3 px-4 rounded-lg break-words ${message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {/* Basic whitespace handling for newlines */}
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Chat Window Component
const ChatWindow: React.FC = () => {
    const {
        currentConversation,
        setCurrentConversation, // Get setCurrentConversation for implicit creation flow
        updateConversationMessages,
        addConversation,
        getCurrentConversation // Function to get latest currentConversation state
    } = useConversations();

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    // Removed local selectedModel state - model is now part of the conversation
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);

    // Removed the useEffect hook that implicitly created conversations on input change

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        // Scroll to bottom when messages update
        if (currentConversation?.messages?.length) {
             // Delay slightly to allow DOM update after streaming
            setTimeout(scrollToBottom, 100);
        }
    }, [currentConversation?.messages, scrollToBottom]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSubmitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isStreaming) return;

        setStreamError(null);
        setInputValue(''); // Clear input immediately

        let conversationToUpdate: Conversation | null = getCurrentConversation(); // Get latest state
        let conversationId: string;
        let modelToUse: string;

        // --- Handle New Conversation Creation ---
        if (!conversationToUpdate) {
            const newConvId = `conv-${crypto.randomUUID()}`; // Use UUID
            const newConversation: Conversation = {
                id: newConvId,
                title: trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? '...' : ''), // Generate title
                messages: [],
                model: 'ChatGPT', // Use a default model for implicitly created conversations
                lastUpdated: new Date(),
            };
            addConversation(newConversation); // Add to global state
            setCurrentConversation(newConversation); // Set as current immediately for this render cycle
            conversationToUpdate = newConversation; // Use this new object for the rest of the function
            console.log("Created new conversation implicitly:", newConversation.id, "with model:", newConversation.model);
        }

        // Ensure we definitely have a conversation object now
        if (!conversationToUpdate) {
            console.error("Failed to get or create a conversation.");
            setStreamError("An internal error occurred. Please try starting a new chat.");
            return;
        }

        conversationId = conversationToUpdate.id;
        modelToUse = conversationToUpdate.model; // Use the model associated with the conversation

        // --- Add User Message ---
        const userMessage: Message = {
            id: `msg-${crypto.randomUUID()}-user`, // Use UUID
            role: 'user',
            content: trimmedInput,
            timestamp: new Date(),
        };

        // Use functional update for messages to avoid stale state issues
        const updatedMessages = [...conversationToUpdate.messages, userMessage];
        updateConversationMessages(conversationId, updatedMessages); // Update state

        setIsStreaming(true); // Start streaming indicator

        // --- Call Backend API ---
        try {
            console.log(`Sending request to users/chat for conversation ${conversationId} using model ${modelToUse}`);
            const response = await fetch('api/users/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the model associated with the conversation
                body: JSON.stringify({
                    query: userMessage.content,
                    model: modelToUse // Send the conversation's model
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to start chat stream: ${response.status} ${response.statusText}`, errorText);
                setStreamError(`Chat error: ${response.statusText}`);
                setIsStreaming(false);
                 // Optionally revert user message or add error message to chat
                return;
            }

            if (!response.body) {
                console.error("Response body is null");
                setStreamError("No response from server");
                setIsStreaming(false);
                return;
            }

            // --- Begin Streaming Response ---
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = '';
            let assistantContent = '';
            const assistantMessageId = `msg-${crypto.randomUUID()}-ai`; // Use UUID

            // Add placeholder assistant message immediately
            const placeholderAssistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '...', // Placeholder content
                timestamp: new Date(),
            };

             // Use the latest known messages + user message + placeholder
            const messagesWithPlaceholder = [...updatedMessages, placeholderAssistantMessage];
            updateConversationMessages(conversationId, messagesWithPlaceholder);


            // Read the stream
            const read = async () => {
                try {
                    const { done, value } = await reader.read();

                    if (done) {
                        // Finalize assistant message
                        const finalAssistantMessage: Message = {
                            ...placeholderAssistantMessage, // Keep same ID and role
                            content: assistantContent || "Sorry, I couldn't generate a response.", // Use accumulated content or error message
                            timestamp: new Date(), // Update timestamp
                        };
                        // Update with final message (replace placeholder)
                        const finalMessages = [...updatedMessages, finalAssistantMessage];
                        updateConversationMessages(conversationId, finalMessages);
                        setIsStreaming(false);
                        console.log("Stream finished for conversation:", conversationId);
                        return;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop() || ''; // Keep incomplete part in buffer

                    for (let part of parts) {
                        if (part.startsWith("data: ")) {
                            const jsonStr = part.slice(6);
                            try {
                                const data = JSON.parse(jsonStr);
                                // Adjust based on your actual API response structure
                                if (data.payload_type === "message" && typeof data.content === 'string') {
                                    assistantContent += data.content;

                                    // Update the message in real-time
                                    const streamingAssistantMessage: Message = {
                                       ...placeholderAssistantMessage, // Keep same ID and role
                                        content: assistantContent + '▌', // Append partial content + cursor
                                        timestamp: new Date(), // Update timestamp
                                    };
                                    const messagesWithStreaming = [...updatedMessages, streamingAssistantMessage];
                                    updateConversationMessages(conversationId, messagesWithStreaming);
                                }
                            } catch (e) {
                                console.error("Error parsing JSON stream chunk:", e, "Raw data:", jsonStr);
                            }
                        }
                    }
                    // Continue reading
                    read();
                } catch (err) {
                    console.error("Error reading stream:", err);
                    setStreamError("Error reading response stream");
                     // Finalize with error content
                    const errorAssistantMessage: Message = {
                        ...placeholderAssistantMessage,
                        content: assistantContent + "\n\n[Error reading stream]",
                        timestamp: new Date(),
                    };
                    const finalMessages = [...updatedMessages, errorAssistantMessage];
                    updateConversationMessages(conversationId, finalMessages);
                    setIsStreaming(false);
                }
            };

            read(); // Start reading the stream

        } catch (error) {
            console.error("Error in chat stream submission:", error);
            setStreamError("Failed to connect to chat service. Please check your connection and try again.");
            setIsStreaming(false);
            // Optionally add error message to chat
             const errorAssistantMessage: Message = {
                 id: `msg-${crypto.randomUUID()}-ai-error`,
                 role: 'assistant',
                 content: "[Failed to connect to chat service]",
                 timestamp: new Date(),
             };
             const finalMessages = [...updatedMessages, errorAssistantMessage];
             updateConversationMessages(conversationId, finalMessages);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
                {currentConversation ? (
                    <>
                        <MessageList messages={currentConversation.messages} />
                        <div ref={messagesEndRef} />
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center space-y-6">
                            <h1 className="text-3xl font-semibold">How can I help you today?</h1>
                            {/* Optional: Add model display or selection here if needed */}
                        </div>
                    </div>
                )}

                {streamError && (
                    <div className="max-w-3xl mx-auto mt-4">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                             <strong className="font-bold">Error: </strong>
                             <span className="block sm:inline">{streamError}</span>
                             <button onClick={() => setStreamError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <form onSubmit={handleSubmitMessage} className="max-w-3xl mx-auto relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Message..."
                        className="w-full py-3 pl-4 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out disabled:opacity-50 disabled:bg-gray-100"
                        disabled={isStreaming}
                        aria-label="Chat message input"
                    />
                    <button
                        type="submit"
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out ${isStreaming || !inputValue.trim() ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                        disabled={!inputValue.trim() || isStreaming}
                        aria-label="Send message"
                    >
                        {/* Send Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                         </svg>
                        {/* Optional: Spinner Icon during streaming */}
                        {/* {isStreaming && <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>} */}
                    </button>
                </form>
                <div className="max-w-3xl mx-auto flex justify-between items-center mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                        {/* Placeholder Button 1 */}
                        <button title="Attach file (placeholder)" className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled={isStreaming}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                         {/* Placeholder Button 2 */}
                        <button title="Search (placeholder)" className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled={isStreaming}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center">
                        {isStreaming && (
                            <span className="text-gray-500 mr-2 animate-pulse">Generating response...</span>
                        )}
                        {/* Placeholder Button 3 */}
                        <button title="Info (placeholder)" className="p-1 hover:bg-gray-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Sidebar Component
const Sidebar: React.FC = () => {
    const {
        conversations,
        currentConversation,
        setCurrentConversation,
        addConversation
    } = useConversations();

    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    // This model state is ONLY for selecting the model for NEW conversations created via the button
    const [selectedModel, setSelectedModel] = useState('ChatGPT'); // Default selection

    const handleNewConversation = () => {
        const newConversation: Conversation = {
            id: `conv-${crypto.randomUUID()}`, // Use UUID
            title: 'New Conversation', // Default title, maybe update after first message?
            messages: [],
            model: selectedModel, // Use the model selected in the sidebar dropdown
            lastUpdated: new Date(),
        };
        addConversation(newConversation);
        // addConversation already sets it current
        console.log("Created new conversation from sidebar:", newConversation.id, "with model:", newConversation.model);
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setCurrentConversation(conversation);
    };

     const handleModelSelect = (modelName: string) => {
        setSelectedModel(modelName);
        setIsModelDropdownOpen(false);
        // Optionally, you could update the currentConversation's model here if one is active,
        // but that might be confusing UX. Sticking to new conversations only for now.
    };


    // Function to group conversations dynamically (Example)
    const groupConversations = (convs: ConversationGroup[]): ConversationGroup[] => {
        // Flatten conversations first
        const allConvs = convs.flatMap(group => group.conversations);
        // Sort by lastUpdated descending
        allConvs.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
        const startOf30DaysAgo = new Date(startOfToday);
        startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

        const grouped: { [key: string]: Conversation[] } = {
            Today: [],
            Yesterday: [],
            'Previous 7 Days': [],
            'Previous 30 Days': [],
            Older: [],
        };

        allConvs.forEach(conv => {
            const updatedTime = conv.lastUpdated.getTime();
            if (updatedTime >= startOfToday.getTime()) {
                grouped.Today.push(conv);
            } else if (updatedTime >= startOfYesterday.getTime()) {
                grouped.Yesterday.push(conv);
            } else if (updatedTime >= startOf7DaysAgo.getTime()) {
                grouped['Previous 7 Days'].push(conv);
            } else if (updatedTime >= startOf30DaysAgo.getTime()) {
                grouped['Previous 30 Days'].push(conv);
            } else {
                grouped.Older.push(conv);
            }
        });

        // Format into ConversationGroup array, filtering out empty groups
        return Object.entries(grouped)
            .map(([title, conversations]) => ({ title, conversations }))
            .filter(group => group.conversations.length > 0);
    };

    const displayedConversationGroups = groupConversations(conversations);


    return (
        <div className="flex flex-col h-full bg-gray-50"> {/* Subtle background for sidebar */}
            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={handleNewConversation}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New chat
                </button>
            </div>

            {/* Model Selection */}
            <div className="px-4 py-3 mb-2 relative border-b border-gray-200">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Model</label>
                <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center justify-between w-full py-2 px-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
                    aria-haspopup="listbox"
                    aria-expanded={isModelDropdownOpen}
                >
                    <span className="text-sm">{selectedModel}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {isModelDropdownOpen && (
                    <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1" role="listbox">
                        {/* List your available models here */}
                        <button onClick={() => handleModelSelect('ChatGPT')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="option" aria-selected={selectedModel === 'ChatGPT'}>ChatGPT</button>
                        <button onClick={() => handleModelSelect('GPT Turbo')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="option" aria-selected={selectedModel === 'GPT Turbo'}>GPT Turbo</button>
                        <button onClick={() => handleModelSelect('Literature Review Writer')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" role="option" aria-selected={selectedModel === 'Literature Review Writer'}>Literature Review Writer</button>
                         {/* Add more models as needed */}
                    </div>
                )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {displayedConversationGroups.map((group, groupIndex) => (
                    <div key={group.title + groupIndex} className="mb-2"> {/* Use title + index for key */}
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {group.title}
                        </h3>
                        <ul>
                            {group.conversations.map((conversation) => (
                                <li key={conversation.id}>
                                    <button
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={`flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-200 focus:outline-none focus:bg-gray-200 transition duration-150 ease-in-out ${currentConversation?.id === conversation.id ? 'bg-gray-200 font-medium' : ''}`}
                                    >
                                        <span className="w-full text-left truncate">{conversation.title}</span>
                                        {/* Optional: Add delete/rename icons on hover */}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                 {displayedConversationGroups.length === 0 && (
                    <p className="text-center text-sm text-gray-500 px-4 py-4">No conversations yet.</p>
                 )}
            </div>

            {/* Footer / Upgrade Plan */}
            <div className="p-4 border-t border-gray-200">
                {/* Simplified Footer Element */}
                <button className="flex items-center gap-2 text-sm w-full p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-left">
                        <div className="font-medium">Upgrade plan</div>
                        <div className="text-xs text-gray-500">Get more features</div>
                    </div>
                </button>
            </div>
        </div>
    );
};


// Header Component
const Header: React.FC<{ toggleSidebar: () => void; currentConversation: Conversation | null }> = ({ toggleSidebar, currentConversation }) => {
    // Simple header, displays current conversation title if available
    return (
        <div className="flex items-center px-4 h-14 border-b border-gray-200 bg-white flex-shrink-0">
            {/* Sidebar Toggle */}
            <button onClick={toggleSidebar} className="mr-4 p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="sr-only">Toggle Sidebar</span>
            </button>
             {/* Display Current Conversation Title or Default */}
             <h2 className="text-lg font-semibold truncate">
                 {currentConversation?.title || "Chat"}
             </h2>
             {/* Optional: Add other header elements like model display */}
            {currentConversation && (
                 <span className="ml-3 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{currentConversation.model}</span>
            )}
        </div>
    );
};


// Main Application Component Provider
const ConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Sample conversation data (ensure lastUpdated are Date objects)
    const initialConversations: ConversationGroup[] = [
        {
            title: 'Today', // Group titles are less relevant now with dynamic grouping
            conversations: [
                {
                    id: 'conv-initial-1', // Use string IDs
                    title: 'Windows Python Setup Guide',
                    messages: [
                        { id: 'msg-initial-1', role: 'user', content: 'How do I set up Python on Windows?', timestamp: new Date() },
                        { id: 'msg-initial-2', role: 'assistant', content: 'To set up Python on Windows, first download the installer from python.org...', timestamp: new Date() },
                    ],
                    model: 'ChatGPT',
                    lastUpdated: new Date(),
                },
            ],
        },
        {
            title: 'Previous 7 Days',
            conversations: [
                 {
                    id: 'conv-initial-2',
                    title: 'Backend Web Scraping Setup',
                    messages: [],
                    model: 'ChatGPT',
                    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
            ],
        },
         {
            title: 'Older',
            conversations: [
                 {
                    id: 'conv-initial-3',
                    title: 'RAG Pipeline Security Design',
                    messages: [],
                    model: 'GPT Turbo',
                    lastUpdated: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
                },
            ],
        },

    ];

    const [conversations, setConversations] = useState<ConversationGroup[]>(initialConversations);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    // Use a ref to store the current conversation to avoid stale closures in callbacks
    const currentConversationRef = useRef<Conversation | null>(null);

    useEffect(() => {
        currentConversationRef.current = currentConversation;
    }, [currentConversation]);

     const getCurrentConversation = useCallback(() => {
        return currentConversationRef.current;
    }, []);


    const addConversation = useCallback((conversation: Conversation) => {
         // Add to the start of the first group (or create 'Today' if needed)
        setConversations(prev => {
            const updatedConversations = [...prev];
            // Find or create the 'Today' group conceptually (dynamic grouping handles display)
            // For simplicity in state update, just add to the first group
            if (updatedConversations.length === 0) {
                 updatedConversations.push({ title: "Today", conversations: [] });
            }
            // Add to the beginning of the first group's list
             updatedConversations[0].conversations.unshift(conversation);
             return updatedConversations;
        });
        setCurrentConversation(conversation); // Set the newly added one as current
    }, []); // No dependencies needed if using functional updates


    const updateConversationMessages = useCallback((id: string, messages: Message[]) => {
        const now = new Date();
         // Use functional update to ensure we work with the latest state
        setConversations(prevConversations => {
            return prevConversations.map(group => ({
                ...group,
                conversations: group.conversations.map(conv =>
                    conv.id === id
                        ? { ...conv, messages, lastUpdated: now } // Update messages and timestamp
                        : conv
                ),
            }));
        });

         // Also update the current conversation state directly if it's the one being modified
        setCurrentConversation(prevCurrent => {
             if (prevCurrent?.id === id) {
                 return { ...prevCurrent, messages, lastUpdated: now };
             }
             return prevCurrent;
         });
    }, []); // No dependencies needed


    const value = {
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        addConversation,
        updateConversationMessages,
        getCurrentConversation,
    };

    // Select the first conversation on initial load (optional)
    useEffect(() => {
        if (!currentConversation && conversations.length > 0 && conversations[0].conversations.length > 0) {
           // setCurrentConversation(conversations[0].conversations[0]);
           // Maybe better to start with no selection?
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount


    return (
        <ConversationsContext.Provider value={value}>
            {children}
        </ConversationsContext.Provider>
    );
};

// Main Chat Layout Component
const Chat: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Wrap the main content in the provider
    // Then access the context value needed for the Header
    const MainContent: React.FC = () => {
        const { currentConversation } = useConversations();
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} currentConversation={currentConversation} />
                <ChatWindow />
            </div>
        );
    }

    return (
        <ConversationsProvider>
            <div className="flex h-screen bg-white text-gray-900 font-sans">
                {/* Sidebar */}
                <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
                   {isSidebarOpen && <Sidebar />} {/* Conditionally render Sidebar content for clean transition */}
                </div>

                {/* Main Content Area */}
                 <MainContent />
            </div>
        </ConversationsProvider>
    );
};

export default Chat;