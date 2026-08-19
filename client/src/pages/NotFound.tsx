import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="grid min-h-[55vh] place-items-center px-5 text-center">
      <section className="w-full max-w-xl border-y border-white/[0.25] px-4 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto grid h-12 w-12 place-items-center border border-[#eab78c]/65 text-[#ffd9b0]"><AlertCircle size={22} /></div>
        <p className="editorial-kicker mt-7">404 · 页面不存在</p>
        <h1 className="display-title mt-3 text-4xl sm:text-5xl">这个链接没有<br /><span className="display-accent">可打开的内容。</span></h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-[#c7cbd0]">页面可能已被移动、删除，或地址并不正确。可以返回首页，从文章、归档或标签重新开始查找。</p>
        <div id="not-found-button-group" className="mt-8 flex justify-center">
          <Button onClick={handleGoHome} className="editorial-button editorial-button-primary px-5">
            <Home className="mr-2 h-4 w-4" />返回首页
          </Button>
        </div>
      </section>
    </div>
  );
}
