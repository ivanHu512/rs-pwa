import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function Modal({
  isOpen = false,
  onOpenChange,
  children,
  title,
  className,
  container,
}: {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  container?: HTMLElement | null;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn("max-w-xl", className)}
        container={container}
      >
        <AlertDialogHeader className="hidden">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  );
}
