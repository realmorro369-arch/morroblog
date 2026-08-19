import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BlogLayout from "./components/BlogLayout";
const PostsList = lazy(() => import("./pages/PostsList"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const Archives = lazy(() => import("./pages/Archives"));
const Timeline = lazy(() => import("./pages/Timeline"));
const TagsPage = lazy(() => import("./pages/TagsPage"));
const About = lazy(() => import("./pages/About"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const GalleryDetail = lazy(() => import("./pages/GalleryDetail"));
const PostWorkspace = lazy(() => import("./pages/PostWorkspace"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

function PageLoading() {
  return <div className="grid min-h-[45vh] place-items-center"><div className="rounded-2xl border border-white/[0.13] bg-[#202630]/78 px-5 py-4 text-center shadow-lg shadow-black/10"><p className="text-sm text-slate-200">正在打开页面…</p><p className="mt-1 text-xs text-slate-400">内容马上就好。</p></div></div>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/posts" component={PostsList} />
      <Route path="/posts/:slug" component={PostDetail} />
      <Route path="/admin/content/new" component={CreatePost} />
      <Route path="/admin/content/:id/edit" component={CreatePost} />
      <Route path="/create" component={CreatePost} />
      <Route path="/edit/:id" component={CreatePost} />
      <Route path="/workspace" component={PostWorkspace} />
      <Route path="/archives" component={Archives} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/tags" component={TagsPage} />
      <Route path="/gallery/:id" component={GalleryDetail} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/about" component={About} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/login" component={AuthPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppFrame() {
  const [location] = useLocation();
  const routedContent = <Router />;
  return location.startsWith("/admin") ? routedContent : <BlogLayout>{routedContent}</BlogLayout>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <AppFrame />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
