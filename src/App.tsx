import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CategoryDetail from "./pages/CategoryDetail";
import SubcategoryDetail from "./pages/SubcategoryDetail";
import FeaturedCardsPage from "./pages/FeaturedCardsPage";
import AllSubcategoriesPage from "./pages/AllSubcategoriesPage";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { path: "/", element: <Index /> },
    { path: "/category/:id", element: <CategoryDetail /> },
    { path: "/category/:categoryId/subcategory/:subcategoryId", element: <SubcategoryDetail /> },
    { path: "/category/:categoryId/subcategories", element: <AllSubcategoriesPage /> },
    { path: "/featured-cards/:sectionId", element: <FeaturedCardsPage /> },
    { path: "/admin/login", element: <AdminLogin /> },
    { path: "/admin", element: <AdminDashboard /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
