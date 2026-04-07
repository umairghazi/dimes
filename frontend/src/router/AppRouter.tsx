import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard/Dashboard";
import { Expenses } from "@/pages/Expenses/Expenses";
import { Upload } from "@/pages/Upload/Upload";
import { Budgets } from "@/pages/Budgets/Budgets";
import { Analytics } from "@/pages/Analytics/Analytics";
import { Settings } from "@/pages/Settings/Settings";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="upload" element={<Upload />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
