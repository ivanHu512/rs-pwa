import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Modal({
  isOpen = false,
  onOpenChange,
  children,
  title,
  className,
  showCloseButton = true,
}: {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}
      
    >
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn("sm:max-w-[425px]", className)}
      >
        <DialogHeader className="hidden">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        {children}
        {/* <DialogClose asChild>Close</DialogClose> */}
      </DialogContent>
    </Dialog>
  );
}
