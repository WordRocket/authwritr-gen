
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  History, 
  Settings, 
  LogOut, 
  PenTool, 
  BookOpen,
  BookTemplate
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  // Menu items
  const menuItems = [
    {
      title: "Dashboard",
      path: "/",
      icon: Home,
    },
    {
      title: "Templates",
      path: "/templates",
      icon: BookTemplate,
    },
    {
      title: "My Content",
      path: "/content",
      icon: FileText,
    },
    {
      title: "History",
      path: "/history",
      icon: History,
    },
  ];

  const settingsItems = [
    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="flex flex-row items-center px-4 py-2">
            <PenTool className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">ContentGenius</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild
                        // Fix: replaced `active` with a className based on location
                        className={location.pathname === item.path ? "bg-accent text-accent-foreground" : ""}
                      >
                        <Link to={item.path} className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild
                        // Fix: replaced `active` with a className based on location
                        className={location.pathname === item.path ? "bg-accent text-accent-foreground" : ""}
                      >
                        <Link to={item.path} className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button 
              variant="outline" 
              onClick={logout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <SidebarTrigger />
              <h2 className="ml-4 font-semibold">
                {menuItems.find(item => item.path === location.pathname)?.title || "ContentGenius"}
              </h2>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
