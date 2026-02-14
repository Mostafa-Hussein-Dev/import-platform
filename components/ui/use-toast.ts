import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const toast = ({ title, description, variant = "default" }: ToastProps) => {
  if (variant === "destructive") {
    sonnerToast(title || "Error", {
      description,
      style: {
        background: "hsl(0 84.2% 60.2%)",
        color: "white",
        border: "none",
      },
    });
  } else {
    sonnerToast(title || "Success", {
      description,
    });
  }
};

export { Toaster } from "sonner";
