import { Sidebar } from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1">
                <aside className="hidden md:block">
                    <Sidebar />
                </aside>
                <main className="flex-1 p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
