import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Instagram, Facebook, Mail, MessageCircle, Search, Send,
  Sparkles, User, Phone, ShoppingBag, Tag, Clock, ArrowLeft,
} from "lucide-react";

// TODO: wire to real API
type Channel = "instagram" | "facebook" | "email" | "whatsapp";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  channel: Channel;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
}

const channelIcon: Record<Channel, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  email: Mail,
  whatsapp: MessageCircle,
};

const channelColor: Record<Channel, string> = {
  instagram: "text-pink-500",
  facebook: "text-blue-500",
  email: "text-orange-500",
  whatsapp: "text-green-500",
};

const conversations: Conversation[] = [
  { id: "1", name: "Arta Krasniqi", channel: "instagram", lastMessage: "Hi! Can I order 5 cases of 1.5L for an event this Saturday?", timestamp: "2 min", unread: 2 },
  { id: "2", name: "Driton Berisha", channel: "whatsapp", lastMessage: "Do you deliver to Prizren? I need 10 packs.", timestamp: "18 min", unread: 1 },
  { id: "3", name: "Lindita Gashi", channel: "facebook", lastMessage: "Love the new packaging! Where can I buy in Prishtina?", timestamp: "1h", unread: 0 },
  { id: "4", name: "Besnik Hoxha", channel: "email", lastMessage: "RE: Wholesale pricing request for HoReCa partnership", timestamp: "2h", unread: 3 },
  { id: "5", name: "Teuta Shala", channel: "instagram", lastMessage: "Your spring campaign video is amazing. Collab?", timestamp: "3h", unread: 0 },
  { id: "6", name: "Faton Rugova", channel: "whatsapp", lastMessage: "Received the order, thank you! Quality is great.", timestamp: "5h", unread: 0 },
  { id: "7", name: "Vlora Mehmeti", channel: "facebook", lastMessage: "Is the glass bottle available in 0.5L?", timestamp: "1d", unread: 0 },
  { id: "8", name: "Alban Kastrati", channel: "email", lastMessage: "Following up on the invoice for order #4821", timestamp: "2d", unread: 1 },
];

const activeThread: Message[] = [
  { id: "m1", text: "Hi there! I saw your new Uje Karadaku premium collection on Instagram.", sent: false, time: "10:23 AM" },
  { id: "m2", text: "Can I order 5 cases of 1.5L for an event this Saturday?", sent: false, time: "10:23 AM" },
  { id: "m3", text: "Hello Arta! Of course. We have the 1.5L premium still in stock. 5 cases = 30 bottles, correct?", sent: true, time: "10:25 AM" },
  { id: "m4", text: "Yes exactly! What's the price for that quantity?", sent: false, time: "10:28 AM" },
  { id: "m5", text: "For 5 cases, that would be EUR 45.00 total (EUR 1.50 per bottle). We can deliver Friday evening if that works?", sent: true, time: "10:30 AM" },
  { id: "m6", text: "Perfect, Friday evening works great. I'll send you the address!", sent: false, time: "10:32 AM" },
];

const customerDetails = {
  name: "Arta Krasniqi",
  email: "arta.krasniqi@email.com",
  phone: "+383 44 123 456",
  totalOrders: 8,
  lifetimeValue: "EUR 312.50",
  tags: ["VIP", "Event Planner", "Prishtina"],
};

const aiReplies = [
  "Great! I'll schedule the delivery for Friday at 6 PM. Could you please share your address?",
  "We also have a 10% discount for orders over EUR 50 if you'd like to add another case!",
  "I'll send you a confirmation email with the order details and delivery time.",
];

const channelCounts: Record<string, number> = {
  all: 7,
  instagram: 2,
  facebook: 2,
  email: 2,
  whatsapp: 1,
};

export default function UnifiedInbox() {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showThread, setShowThread] = useState(false);

  const filtered = conversations.filter((c) => {
    const matchesChannel = channelFilter === "all" || c.channel === channelFilter;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <Tabs value={channelFilter} onValueChange={setChannelFilter} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50">
            {Object.entries(channelCounts).map(([key, count]) => (
              <TabsTrigger key={key} value={key} className="text-xs sm:text-sm capitalize">
                {key === "all" ? "All" : key}
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 gap-0 border border-border rounded-lg overflow-hidden bg-card min-h-0">
        {/* Left — Conversation list */}
        <div className={`w-full md:w-80 md:block border-r border-border flex-shrink-0 ${showThread ? "hidden" : "block"}`}>
          <ScrollArea className="h-full">
            {filtered.map((convo) => {
              const Icon = channelIcon[convo.channel];
              const isActive = convo.id === activeConvo.id;
              return (
                <button
                  key={convo.id}
                  onClick={() => { setActiveConvo(convo); setShowThread(true); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border ${isActive ? "bg-muted/70" : ""}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {convo.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${convo.unread ? "text-foreground" : "text-muted-foreground"}`}>
                        {convo.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">{convo.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Icon className={`h-3 w-3 flex-shrink-0 ${channelColor[convo.channel]}`} />
                      <span className="text-xs text-muted-foreground truncate">{convo.lastMessage}</span>
                    </div>
                  </div>
                  {convo.unread > 0 && (
                    <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] flex-shrink-0 bg-primary text-primary-foreground">
                      {convo.unread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* Center — Thread */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showThread ? "hidden md:flex" : "flex"}`}>
          {/* Thread header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setShowThread(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {activeConvo.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{activeConvo.name}</p>
              <div className="flex items-center gap-1">
                {(() => { const Icon = channelIcon[activeConvo.channel]; return <Icon className={`h-3 w-3 ${channelColor[activeConvo.channel]}`} />; })()}
                <span className="text-[11px] text-muted-foreground capitalize">{activeConvo.channel}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-3">
              <p className="text-center text-[11px] text-muted-foreground">Today, 10:23 AM</p>
              {activeThread.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.sent ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Compose */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 h-9"
                onKeyDown={(e) => { if (e.key === "Enter") { /* TODO: wire to real API */ } }}
              />
              <Button size="icon" className="h-9 w-9 flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right — Customer details (hidden on mobile) */}
        <div className="hidden lg:flex w-72 flex-col border-l border-border flex-shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Profile */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-3">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">AK</AvatarFallback>
                </Avatar>
                <h3 className="text-sm font-semibold">{customerDetails.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />{customerDetails.email}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />{customerDetails.phone}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/30">
                  <CardContent className="p-3 text-center">
                    <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{customerDetails.totalOrders}</p>
                    <p className="text-[10px] text-muted-foreground">Orders</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{customerDetails.lifetimeValue}</p>
                    <p className="text-[10px] text-muted-foreground">LTV</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customerDetails.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[11px]">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* AI Suggested Replies */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">AI Suggested Replies</span>
                </div>
                <div className="space-y-2">
                  {aiReplies.map((reply, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full h-auto text-left text-xs py-2 px-3 whitespace-normal leading-relaxed"
                      onClick={() => setMessageInput(reply)}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
