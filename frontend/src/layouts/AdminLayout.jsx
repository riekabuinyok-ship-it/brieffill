import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64 transition-all duration-300">
        <div className="p-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
