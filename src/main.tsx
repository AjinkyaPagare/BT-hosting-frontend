import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { resolveInitialTheme, applyTheme } from "./utils/theme";

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

createRoot(document.getElementById("root")!).render(<App />);
