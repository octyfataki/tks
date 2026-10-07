export default async function AdminNotificationsPage() {
  // Le shell SidebarProvider + AppSidebar + AdminHeader vit dans
  // /admin/layout : ici, uniquement le contenu.
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <h1 className="text-lg font-semibold">Notifications</h1>
    </div>
  );
}
