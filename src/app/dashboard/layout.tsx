import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider,SidebarTrigger } from "@/components/ui/sidebar";




export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
           
           <SidebarProvider
      
    >
     
        <AppSidebar />
          <SidebarTrigger className="p-4 " />
          {children}
        
      
    </SidebarProvider>
    
    </div>
  );
}

