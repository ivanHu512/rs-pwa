import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn, getIOSVersion } from "@/lib/utils";

export default function CustomerDrawer({
  isOpen,
  onOpenChange,
  trigger,
  children,
  className,
  container,
  zIndex,
  dismissible = true,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  container?: HTMLElement | null;
  zIndex?: number;
  dismissible?: boolean;
}) {
  const iOSVersion = getIOSVersion();

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      container={container}
      dismissible={dismissible}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        className={cn(
          `mx-auto w-full max-w-xl !rounded-t-[16px] p-4`,
          iOSVersion && iOSVersion < 16 ? "low-device" : "",
          className,
        )}
      >
        {onOpenChange && (
          <DrawerClose asChild className="absolute right-4 top-4 z-10">
            <img
              src="https://v-mps.crazymaplestudios.com/images/d69d4480-c528-11f0-84ad-6b5693b490dc.png"
              alt="close"
              className="h-6 w-6"
            />
          </DrawerClose>
        )}

        <DrawerHeader className="hidden">
          <DrawerTitle></DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        {children}
        {/* <DrawerFooter></DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
