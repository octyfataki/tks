import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "./button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      data-slot="pagination"
      className={cn("flex w-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex max-w-full items-center gap-1 overflow-x-auto", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({
  className,
  isActive,
  render,
  size = "icon-sm",
  ...props
}: useRender.ComponentProps<"a"> & {
  isActive?: boolean;
  size?: "icon-sm" | "icon";
}) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        "aria-current": isActive ? "page" : undefined,
        className: cn(
          buttonVariants({
            variant: isActive ? "outline" : "ghost",
            size,
          }),
          isActive && "border-primary/40 bg-primary/10 text-primary",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "pagination-link",
    },
  });
}

function PaginationPrevious({
  desactive,
  ...props
}: React.ComponentProps<typeof PaginationPreviousLien> & {
  desactive?: boolean;
}) {
  if (desactive) {
    return (
      <span
        aria-disabled="true"
        data-slot="pagination-previous"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-none inline-flex shrink-0 items-center justify-center gap-1 rounded-md opacity-50 [&_svg]:size-3.5",
          props.className,
        )}
      >
        <ChevronLeftIcon />
        <span className="hidden sm:block">{props.text ?? "Précédent"}</span>
      </span>
    );
  }
  return <PaginationPreviousLien {...props} />;
}

function PaginationPreviousLien({
  className,
  render,
  text = "Précédent",
  ...props
}: useRender.ComponentProps<"a"> & { text?: string }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        "aria-label": "Aller à la page précédente",
        className: cn(buttonVariants({ variant: "outline" }), className),
        children: (
          <>
            <ChevronLeftIcon />
            <span className="hidden sm:block">{text}</span>
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "pagination-previous",
    },
  });
}

function PaginationNext({
  desactive,
  ...props
}: React.ComponentProps<typeof PaginationNextLien> & {
  desactive?: boolean;
}) {
  if (desactive) {
    return (
      <span
        aria-disabled="true"
        data-slot="pagination-next"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "pointer-events-none inline-flex shrink-0 items-center justify-center gap-1 rounded-md opacity-50 [&_svg]:size-3.5",
          props.className,
        )}
      >
        <span className="hidden sm:block">{props.text ?? "Suivant"}</span>
        <ChevronRightIcon />
      </span>
    );
  }
  return <PaginationNextLien {...props} />;
}

function PaginationNextLien({
  className,
  render,
  text = "Suivant",
  ...props
}: useRender.ComponentProps<"a"> & { text?: string }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        "aria-label": "Aller à la page suivante",
        className: cn(buttonVariants({ variant: "outline" }), className),
        children: (
          <>
            <span className="hidden sm:block">{text}</span>
            <ChevronRightIcon />
          </>
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "pagination-next",
    },
  });
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-6 items-center justify-center text-muted-foreground",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-3.5" />
      <span className="sr-only">Plus de pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
