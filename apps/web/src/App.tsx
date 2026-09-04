import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { EmptyState } from "./components/EmptyState";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

function NotFound() {
  return (
    <EmptyState
      icon="package"
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <Link to="/" className="btn-primary">
          Go home
        </Link>
      }
    />
  );
}

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;
