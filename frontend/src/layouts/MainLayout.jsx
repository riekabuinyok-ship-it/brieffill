import Navigation from "../components/Navigation";
import BottomNav from "../components/BottomNav";

export default function MainLayout({ children }) {
  return (
    <>
      <Navigation />
      <main className="min-h-[calc(100vh-4rem)] pt-16 pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
