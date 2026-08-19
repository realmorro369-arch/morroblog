/**
 * React adaptation of Halo Console's `src/layouts/BasicLayout.vue`.
 * Upstream: https://github.com/halo-dev/console/blob/d6616cf7031f6113cfb5c317dc88abd9e674c44e/src/layouts/BasicLayout.vue
 * License: GPL-3.0-or-later. Original source and full license are retained under `third_party/halo-console/`.
 * Adaptations: Vue Router/Pinia/Halo REST calls are replaced with Wouter, useAuth and MorroBlog's tRPC-backed pages.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BookOpenText, ChevronLeft, FilePlus2, FileText, ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings2, Tags, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export type ConsoleSection = "overview" | "posts" | "comments" | "terms" | "gallery" | "users" | "settings";
type ConsoleMenuItem = { id: ConsoleSection | "write"; label: string; icon: LucideIcon };

type DashboardLayoutProps = {
  activeSection: ConsoleSection;
  onSectionChange: (section: ConsoleSection) => void;
  children: React.ReactNode;
};

const menuGroups: { label: string; items: ConsoleMenuItem[] }[] = [
  { label: "工作台", items: [{ id: "overview", label: "仪表盘", icon: LayoutDashboard }] },
  { label: "内容", items: [{ id: "posts", label: "文章", icon: FileText }, { id: "write", label: "写文章", icon: FilePlus2 }, { id: "terms", label: "标签与分类", icon: Tags }] },
  { label: "媒体与互动", items: [{ id: "gallery", label: "图片集", icon: ImageIcon }, { id: "comments", label: "评论", icon: MessageSquareText }] },
  { label: "系统", items: [{ id: "settings", label: "站点设置", icon: Settings2 }, { id: "users", label: "用户", icon: Users }] },
];

function pageTitle(activeSection: ConsoleSection) {
  return menuGroups.flatMap(group => group.items).find(item => item.id === activeSection)?.label || "仪表盘";
}

export default function DashboardLayout({ activeSection, onSectionChange, children }: DashboardLayoutProps) {
  const { loading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user || user.role !== "admin") {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5 text-center text-[#1c2730]"><div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm"><p className="text-xs font-medium tracking-[0.14em] text-slate-500">MORROBLOG CONSOLE</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">此空间仅对管理员开放。</h1><p className="mt-4 text-sm leading-7 text-slate-600">控制台权限仍由服务端角色校验，不以菜单可见性作为授权依据。</p><Button onClick={() => navigate("/")} className="mt-7 bg-[#2d8a86] px-4 text-white hover:bg-[#23716e]">返回公开站点 <ChevronLeft size={14} className="ml-2 rotate-180" /></Button></div></div>;
  }

  const selectItem = (id: ConsoleSection | "write") => {
    if (id === "write") navigate("/admin/content/new");
    else {
      onSectionChange(id);
      navigate("/admin");
    }
    setMobileMenuOpen(false);
  };

  const navigation = (mobile = false) => <nav className={mobile ? "grid gap-6 px-1 pb-6" : "grid gap-6 px-3 py-4"} aria-label="管理中心导航">
    {menuGroups.map(group => <section key={group.label}>
      <p className="mb-2 px-2 text-[11px] font-medium tracking-wide text-slate-400">{group.label}</p>
      {mobile ? <div className="grid gap-1">{group.items.map(item => <button key={item.id} type="button" onClick={() => selectItem(item.id)} className={`flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors ${item.id === activeSection ? "bg-[#e8f4f3] font-medium text-[#23716e]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><item.icon size={16} />{item.label}</button>)}</div> : <SidebarMenu>{group.items.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={item.id === activeSection} onClick={() => selectItem(item.id)} tooltip={item.label} className="h-9 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-[#e8f4f3] data-[active=true]:font-medium data-[active=true]:text-[#23716e]"><item.icon size={16} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>}
    </section>)}
  </nav>;

  return <SidebarProvider>
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white text-slate-700">
      <SidebarHeader className="border-b border-slate-200 p-3">
        <button type="button" onClick={() => navigate("/")} className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-50">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[#2d8a86] font-semibold text-white">M</span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden"><span className="block text-sm font-semibold tracking-tight text-slate-800">MorroBlog</span><span className="mt-0.5 block text-[11px] text-slate-400">管理中心</span></span>
        </button>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">{navigation()}</SidebarContent>
      <SidebarFooter className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-md p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 border border-slate-200"><AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-600">{user.name?.slice(0, 1).toUpperCase() || "A"}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-slate-700">{user.name || user.email}</p><p className="mt-0.5 text-[11px] text-slate-400">管理员</p></div>
          <button type="button" onClick={() => void logout()} className="text-slate-400 transition-colors hover:text-rose-600 group-data-[collapsible=icon]:hidden" aria-label="退出登录"><LogOut size={15} /></button>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-h-screen bg-[#f5f7f8] text-slate-800">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3"><SidebarTrigger className="hidden text-slate-500 hover:bg-slate-100 md:inline-flex" /><div><p className="text-sm font-semibold text-slate-800">{pageTitle(activeSection)}</p><p className="text-[11px] text-slate-400">MorroBlog Console</p></div></div>
        <div className="flex items-center gap-2"><Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}><DrawerTrigger asChild><button type="button" className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden" aria-label="打开管理菜单"><Menu size={18} /></button></DrawerTrigger><DrawerContent className="border-slate-200 bg-white text-slate-800"><DrawerHeader><DrawerTitle className="text-sm font-semibold">MorroBlog 管理中心</DrawerTitle></DrawerHeader>{navigation(true)}</DrawerContent></Drawer><button type="button" onClick={() => navigate("/")} className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 md:inline-flex">查看站点 <BookOpenText size={14} /></button></div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</main>
    </SidebarInset>
  </SidebarProvider>;
}
