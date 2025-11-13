import { useState } from "react";
import { Search, UserPlus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const mockFriends = [
  { id: "1", name: "John Doe", email: "john@example.com", isOnline: true },
  { id: "2", name: "Jane Smith", email: "jane@example.com", isOnline: false },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", isOnline: true },
];

const mockPendingRequests = [
  { id: "1", name: "Alice Brown", email: "alice@example.com", date: "2 days ago" },
  { id: "2", name: "Charlie Wilson", email: "charlie@example.com", date: "1 week ago" },
];

const mockSentRequests = [
  { id: "1", name: "David Lee", email: "david@example.com", date: "3 days ago" },
];

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-2xl font-bold mb-4">Friends</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="all" className="flex-1">
            All Friends
            <Badge variant="secondary" className="ml-2">{mockFriends.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending
            <Badge variant="secondary" className="ml-2">{mockPendingRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">
            Sent
            <Badge variant="secondary" className="ml-2">{mockSentRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {mockFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" alt={friend.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {friend.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                  </div>
                </div>
                <Button size="sm">Message</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {mockPendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={request.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {request.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{request.name}</p>
                    <p className="text-xs text-muted-foreground">{request.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {mockSentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={request.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {request.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{request.name}</p>
                    <p className="text-xs text-muted-foreground">Sent {request.date}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Cancel</Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-border bg-card">
        <Button className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Friend
        </Button>
      </div>
    </div>
  );
};

export default Friends;
