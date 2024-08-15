import { RouteLocationRaw, RouterLink, _RouterLinkI } from "vue-router";

export interface ButtonProps {
  href?: string,
  to?: RouteLocationRaw
  here?: boolean;
  type?: "button" | "submit" | "reset";
}

export interface ButtonEmits {
  (e: "click", event: Event): void
}

export const useButton = (props: ButtonProps, emit: ButtonEmits) => {
  const component = props.to ? RouterLink : (props.href ? "a" : "button");
  const componentProperties = props.to
    ? { to: props.to, type: props.type }
    : (
      props.href
        ? { href: props.href, target: props.here ? undefined : "_blank", type: props.type }
        : { type: props.type }
    );

  const handleClick = (event: Event): void => emit("click", event);

  return { component, componentProperties, handleClick };
};
