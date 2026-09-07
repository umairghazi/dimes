import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Ledger } from "@/pages/Ledger/Ledger";
import { Summary } from "@/pages/Summary/Summary";
import { Categories } from "@/pages/Categories/Categories";
import { Login } from "@/pages/Auth/Login";
import { Register } from "@/pages/Auth/Register";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Summary />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="categories" element={<Categories />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
