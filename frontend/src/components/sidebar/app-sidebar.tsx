import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "../ui/sidebar";
import Credits from "./credit";
import SidebarMenuItems from "./sidebar-menu-items";
import { LogoutButton } from "../auth/logout-button";
import Upgrade from "./upgrade";

export async function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary mt-4 mb-12 flex flex-col items-start justify-start px-2 text-3xl font-black tracking-widest uppercase">
            <p>Dukem</p>
            <p className="text-lg">Music</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mb-2 flex w-full items-center justify-center gap-1 text-xs">
          <Credits  />
          <Upgrade />
        </div>
        {/* logout button */}
        <div className="mb-2 flex w-full items-center justify-center gap-1 text-xs">
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}