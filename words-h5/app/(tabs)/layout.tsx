import { BottomNav } from 'app/components/BottomNav';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
