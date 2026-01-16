import Swal from "sweetalert2";
import { useTheme } from "../context/ThemeContext";

export const useToast = () => {
  const { isDark } = useTheme();

  return Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? "#1e1e1e" : "#fff",
    color: isDark ? "#fff" : "#000",
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
};
