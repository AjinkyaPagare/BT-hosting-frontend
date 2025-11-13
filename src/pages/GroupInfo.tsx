import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, UserMinus, Crown, LogOut, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const GroupInfo = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const group = {
    name: "Team Alpha",
    description: "Main project team for product development",
    avatar: "",
    adminIds: ["admin1"],
    members: [
      { id: "admin1", name: "Admin User", email: "admin@example.com", isOnline: true, isAdmin: true },
      { id: "user1", name: "John Doe", email: "john@example.com", isOnline: true, isAdmin: false },
      { id: "user2", name: "Jane Smith", email: "jane@example.com", isOnline: false, isAdmin: false },
      { id: "user3", name: "Bob Johnson", email: "bob@example.com", isOnline: true, isAdmin: false },
    ],
  };

  const isAdmin = true; // Mock admin status

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Group Info</h2>
        </div>
      </div>

      <div className="p-6 bg-card border-b border-border">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {group.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {group.members.length} members
            </p>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground max-w-md">{group.description}</p>
          )}
        </div>

        {isAdmin && (
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Group
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Members ({group.members.length})</h3>
            {isAdmin && (
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={member.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                {isAdmin && !member.isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => navigate(`/groups/${groupId}/media`)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media, Links, and Docs
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="lg">
            <LogOut className="h-4 w-4 mr-2" />
            Exit Group
          </Button>
          {isAdmin && (
            <Button variant="outline" className="w-full justify-start text-destructive" size="lg">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
