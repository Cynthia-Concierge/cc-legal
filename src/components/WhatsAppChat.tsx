import { useState } from "react";
import { Send, Phone, Video, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  time: string;
  type: "sent" | "received";
  isRead?: boolean;
}

interface ChatData {
  name: string;
  avatar: string;
  bgColor: string;
  isOnline: boolean;
  messages: Omit<Message, "id">[];
}

interface WhatsAppChatProps {
  chats?: ChatData[];
}

const defaultChats: ChatData[] = [
  {
    name: "Rahul Sharma",
    avatar: "RS",
    bgColor: "bg-blue-500",
    isOnline: true,
    messages: [
      {
        type: "received",
        text: "Bro, I just got selected for Accenture SDE role! 🎉",
        time: "2:45 PM",
      },
      {
        type: "sent",
        text: "Congratulations! How did you prepare?",
        time: "2:46 PM",
        isRead: true,
      },
      {
        type: "received",
        text: "Beep Career Pro was a game changer. The AI mock interviews helped me practice system design questions",
        time: "2:47 PM",
      },
      {
        type: "received",
        text: "Plus the shortlist predictor told me I had 85% chance at Accenture",
        time: "2:47 PM",
      },
      {
        type: "sent",
        text: "That's amazing! 🚀",
        time: "2:48 PM",
        isRead: true,
      },
    ],
  },
  {
    name: "Priya Patel",
    avatar: "PP",
    bgColor: "bg-pink-500",
    isOnline: true,
    messages: [
      {
        type: "received",
        text: "Update: Got the marketing internship at Boat! 🎯",
        time: "11:20 AM",
      },
      {
        type: "sent",
        text: "Wow! That's your dream company",
        time: "11:22 AM",
        isRead: true,
      },
      {
        type: "received",
        text: "Yes! The ATS resume builder made my profile stand out",
        time: "11:23 AM",
      },
      {
        type: "received",
        text: "Got interview call within 3 days of applying through Beep",
        time: "11:23 AM",
      },
      {
        type: "received",
        text: "Worth every penny of the ₹3 trial! 😊",
        time: "11:24 AM",
      },
    ],
  },
  {
    name: "Arjun Kumar",
    avatar: "AK",
    bgColor: "bg-green-500",
    isOnline: true,
    messages: [
      {
        type: "received",
        text: "Placed at EY as Business Analyst! Package: 12 LPA 💰",
        time: "4:15 PM",
      },
      {
        type: "sent",
        text: "Congratulations! How was the interview?",
        time: "4:16 PM",
        isRead: true,
      },
      {
        type: "received",
        text: "The AI interview practice on Beep was exactly like the real one",
        time: "4:17 PM",
      },
      {
        type: "received",
        text: "They asked the same behavioral questions I practiced",
        time: "4:17 PM",
      },
      {
        type: "sent",
        text: "Beep Career Pro really works! 🔥",
        time: "4:18 PM",
        isRead: true,
      },
      {
        type: "received",
        text: "100%! Best investment for job seekers",
        time: "4:18 PM",
      },
    ],
  },
];

export default function WhatsAppChat({
  chats = defaultChats,
}: WhatsAppChatProps) {
  const [selectedChat, setSelectedChat] = useState<number | null>(0);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would add the message to the chat
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (selectedChat !== null) {
    const chat = chats[selectedChat];
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg border">
        {/* Chat Header */}
        <div className="bg-green-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChat(null)}
              className="text-white hover:bg-green-700 p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div
              className={`w-10 h-10 ${chat.bgColor} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
            >
              {chat.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{chat.name}</h3>
              <p className="text-xs opacity-90">
                {chat.isOnline ? "online" : "last seen recently"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700 p-2"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700 p-2"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-green-700 p-2"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {chat.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "sent" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.type === "sent"
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-800 shadow-sm"
                } ${
                  message.type === "sent" ? "rounded-br-sm" : "rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-end mt-1 space-x-1">
                  <span
                    className={`text-xs ${
                      message.type === "sent"
                        ? "text-green-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.time}
                  </span>
                  {message.type === "sent" && message.isRead && (
                    <div className="flex">
                      <div className="w-3 h-3 text-green-200">
                        <svg viewBox="0 0 16 15" className="fill-current">
                          <path d="M10.91 2.29a1 1 0 0 1 1.41 1.42l-7 7a1 1 0 0 1-1.41 0l-3-3a1 1 0 1 1 1.41-1.42L4.5 8.58l6.41-6.29z" />
                          <path d="M15.27 2.29a1 1 0 0 1 1.41 1.42l-7 7a1 1 0 0 1-1.41 0l-.71-.71 1.41-1.41L15.27 2.29z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-3 bg-white border-t flex items-center space-x-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg border">
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <h2 className="text-lg font-semibold">Career Success Stories</h2>
        <p className="text-sm opacity-90">Real conversations from Beep users</p>
      </div>

      {/* Chat List */}
      <div className="divide-y">
        {chats.map((chat, index) => (
          <div
            key={index}
            onClick={() => setSelectedChat(index)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div
                  className={`w-12 h-12 ${chat.bgColor} rounded-full flex items-center justify-center text-white font-semibold`}
                >
                  {chat.avatar}
                </div>
                {chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {chat.messages[chat.messages.length - 1]?.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.messages[chat.messages.length - 1]?.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
