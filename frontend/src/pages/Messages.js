import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import messagingService from "../services/messagingService";
import { useAuth } from "../contexts/AuthContext";
import { APP_CONFIG } from "../config/api";
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  ArrowLeft,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
} from "lucide-react";
import "./Messages.css";

const Messages = () => {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversation, setNewConversation] = useState({
    recipient: "",
    content: "",
  });

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Get provider ID from URL params if starting a new conversation
  const providerId = searchParams.get("provider");

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      markThreadAsRead(selectedThread.id);

      // Start polling for new messages
      const interval = setInterval(() => {
        loadMessages(selectedThread.id, true);
      }, APP_CONFIG.MESSAGE_POLL_INTERVAL);

      setPollingInterval(interval);
    } else {
      // Clear polling when no thread is selected
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }

    // Cleanup on unmount or thread change
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus message input when thread is selected
  useEffect(() => {
    if (selectedThread && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedThread]);

  // Handle provider-specific conversation start
  useEffect(() => {
    if (providerId && !selectedThread) {
      setShowNewConversation(true);
      setNewConversation((prev) => ({
        ...prev,
        recipient: providerId,
      }));
    }
  }, [providerId, selectedThread]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const result = await messagingService.getThreads({ page, page_size: 20 });

      if (result.success) {
        const newThreads = result.data.results || [];
        setThreads((prev) =>
          page === 1 ? newThreads : [...prev, ...newThreads]
        );
        setHasMoreThreads(newThreads.length === 20);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load conversations");
      console.error("Error loading threads:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId, isPolling = false) => {
    try {
      const result = await messagingService.getMessages(threadId, {
        page_size: 50,
      });

      if (result.success) {
        const newMessages = result.data.results || [];

        if (isPolling) {
          // For polling, only update if there are new messages
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const trulyNewMessages = newMessages.filter(
              (m) => !existingIds.has(m.id)
            );
            return trulyNewMessages.length > 0
              ? [...prev, ...trulyNewMessages]
              : prev;
          });
        } else {
          setMessages(newMessages);
        }

        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load messages");
      console.error("Error loading messages:", err);
    }
  };

  const markThreadAsRead = async (threadId) => {
    try {
      await messagingService.markThreadAsRead(threadId);
      // Update thread read status locally
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId ? { ...thread, is_read: true } : thread
        )
      );
    } catch (err) {
      console.error("Error marking thread as read:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    const validation = messagingService.validateMessageContent(newMessage);
    if (!validation.isValid) {
      setError(validation.errors.content);
      return;
    }

    try {
      setSendingMessage(true);

      // Optimistic update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: "current_user", // This should be the current user
        created_at: new Date().toISOString(),
        is_read: false,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      const result = await messagingService.replyToThread(
        selectedThread.id,
        newMessage
      );

      if (result.success) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? result.data : msg
          )
        );

        // Refresh threads to update last message
        loadThreads();
        setError(null);
      } else {
        // Remove optimistic message on failure
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = async () => {
    const contentValidation = messagingService.validateMessageContent(
      newConversation.content
    );

    if (!contentValidation.isValid) {
      setError(contentValidation.errors.content);
      return;
    }

    try {
      setSendingMessage(true);

      const result = await messagingService.startConversation(
        newConversation.recipient,
        newConversation.content
      );

      if (result.success) {
        setShowNewConversation(false);
        setNewConversation({ recipient: "", content: "" });

        // Refresh threads and select the new one
        await loadThreads();
        const newThread = result.data.thread;
        if (newThread) {
          setSelectedThread(newThread);
        }

        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to start conversation");
      console.error("Error starting conversation:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.last_message?.content?.toLowerCase().includes(query) ||
      thread.other_participant?.username?.toLowerCase().includes(query)
    );
  });

  const sortedThreads = messagingService.sortThreadsByLatest(filteredThreads);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </h1>
              <button
                onClick={() => setShowNewConversation(true)}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading && threads.length === 0 ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedThreads.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sortedThreads.map((thread) => {
                  const otherParticipant = messagingService.getOtherParticipant(
                    thread,
                    currentUser?.id
                  );
                  const isSelected = selectedThread?.id === thread.id;

                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-r-2 border-blue-500"
                          : ""
                      } ${!thread.is_read ? "bg-blue-25" : ""}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {otherParticipant?.username
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm truncate ${
                                !thread.is_read
                                  ? "font-semibold text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {otherParticipant?.username || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 flex-shrink-0">
                              {messagingService.formatTimestamp(
                                thread.last_message?.created_at ||
                                  thread.created_at
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {thread.last_message?.content || "No messages yet"}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {messagingService.formatMessagePreview(
                              thread.last_message,
                              40
                            )}
                          </p>
                        </div>
                        {!thread.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No conversations</p>
                <p className="text-sm">
                  Start a new conversation to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Messages */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedThread(null)}
                      className="md:hidden text-gray-500 hover:text-gray-700"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {messagingService
                        .getOtherParticipant(selectedThread, currentUser?.id)
                        ?.username?.charAt(0)
                        .toUpperCase() || "U"}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {messagingService.getOtherParticipant(
                          selectedThread,
                          currentUser?.id
                        )?.username || "Unknown User"}
                      </h2>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_info?.id === currentUser?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`flex items-center justify-end mt-1 space-x-1 ${
                            isOwn ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {messagingService.formatTimestamp(
                              message.created_at
                            )}
                          </span>
                          {isOwn && (
                            <div className="ml-1">
                              {message.is_read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {error}
                  </div>
                )}
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : showNewConversation ? (
            /* New Conversation Form */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Start New Conversation
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient ID
                    </label>
                    <input
                      type="number"
                      value={newConversation.recipient}
                      onChange={(e) =>
                        setNewConversation((prev) => ({
                          ...prev,
                          recipient: e.target.value,
                        }))
                      }
                      placeholder="Enter provider ID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!providerId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={newConversation.content}
                      onChange={(e) =>
                        setNewConversation((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Enter your message"
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={startNewConversation}
                      disabled={
                        sendingMessage ||
                        !newConversation.recipient ||
                        !newConversation.content
                      }
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewConversation(false);
                        if (providerId) navigate("/messages");
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Welcome State */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Messages
                </h2>
                <p className="text-gray-600 mb-4">
                  Select a conversation to start messaging
                </p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
