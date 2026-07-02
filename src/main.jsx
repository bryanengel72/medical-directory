import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DentalCorridorMVP from "./DentalCorridorMVP.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DentalCorridorMVP />
  </StrictMode>
);
