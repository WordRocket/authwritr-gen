
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link, useLocation, Outlet } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  PenTool,
  User,
  AlertCircle
} from "lucide-react";
import { OnboardingModal } from "./OnboardingModal";
import { ThemeToggle } from "./ThemeToggle";

export default function MainLayout() {
  const { isAuthenticated, logout, user, apiKey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  // Show onboarding modal when a user logs in and doesn't have an API key
  useEffect(() => {
    if (isAuthenticated && !apiKey && location.pathname !== "/settings") {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, apiKey, location.pathname]);

  // Menu items - removed History tab
  const menuItems = [
    {
      title: "Dashboard",
      path: "/",
      icon: Home,
    },
    {
      title: "My Content",
      path: "/content",
      icon: FileText,
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
            <h1 className="text-xl font-bold">WordRocket 🚀</h1>
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
          <SidebarFooter className="p-4 space-y-2">
            {user && (
              <div className="flex items-center px-3 py-2 rounded-md bg-accent/50 mb-2">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
            )}
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
                {menuItems.find(item => item.path === location.pathname)?.title || "WordRocket 🚀"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
          
          {/* Beta Banner */}
          <Alert className="rounded-none border-l-4 border-primary bg-primary/10 my-0">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              WordRocket is still in beta. For any issues or recommendations, please email{" "}
              <a href="mailto:support@wordrocket.ai" className="font-medium underline text-primary hover:text-primary/80">
                support@wordrocket.ai
              </a>
            </AlertDescription>
          </Alert>
          
          <div className="p-6">
            <Outlet />
          </div>
        </main>
        
        {/* Onboarding Modal */}
        <OnboardingModal 
          open={showOnboarding} 
          onOpenChange={setShowOnboarding} 
        />
      </div>
    </SidebarProvider>
  );
}
