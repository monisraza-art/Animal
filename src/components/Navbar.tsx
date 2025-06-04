"use client";

import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signIn, signOut, useSession } from "next-auth/react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"


import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NavigationMenuDemo } from "./Navigation-menu";
import { ModeToggle } from "./ModeToggle";
import { usePathname } from "next/navigation";

export default function Navbar() {
   const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

const { data: session } = useSession();
  const user = session?.user;

  if (isDashboard) return null; 
  return (
    <nav className="text-foreground w-full border-b border-border bg-background">
     <div className="flex items-center justify-between px-4 py-3 overflow-visible flex-nowrap gap-4">

        {/* Logo & NavigationMenuDemo (aligned left) */}
        <div className="flex items-center gap-4 shrink-0">
          <Image
            src="/logo-removebg-preview.png"
            alt="Logo"
            width={50}
            height={50}
            className="h-12 w-12 object-contain rounded-full"
          />
          
         
        {/* Main nav links - visible on md+ screens */}
        <div className="hidden lg:flex  gap-4 items-center shrink-0">
          <NavigationMenu>
            <NavigationMenuList className="gap-3">
              {[
                ["Home", "/home"],
                ["Products", "/products"],
                ["Nexus News", "/news"],
                ["Sell Animal", "/sell"],
                ["Buy Animal", "/buy"],
                ["Find Doctor", "/doctor"],
              ].map(([label, href]) => (
                <NavigationMenuItem key={label}>
                  <NavigationMenuLink
  asChild
  className={`${navigationMenuTriggerStyle()} font-normal hover:text-green-500`}
>
                    <Link href={href}>{label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <NavigationMenuDemo />

        </div>



<div className="flex gap-2 justingy-center items-center">
  <ModeToggle/>
        {/* Mobile menu icon - visible on small screens */}
        <div className="md:hidden  shrink-0">



        <Drawer>
  <DrawerTrigger> <MenuIcon className="size-6" /></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Are you absolutely sure?</DrawerTitle>
      <DrawerDescription>This action cannot be undone.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
    
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>


         
        </div>

        {/* Avatar & Dropdown */}

        {/* Auth buttons / avatar */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none border-none bg-transparent p-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/wishlist">Wish list</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/orders">Order history</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline"  onClick={() => signIn('google')}>
                Login
              </Button>
              <Button className="bg-green-500 hover:bg-green-600"  onClick={() => signIn('google')}>Sign up</Button>
            </div>
          )}
      </div>
      </div>
    </nav>
  );
}
