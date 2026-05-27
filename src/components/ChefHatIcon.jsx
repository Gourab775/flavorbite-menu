import { forwardRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

const ChefHatIcon = forwardRef(({ size = 24, color = "currentColor", strokeWidth = 2, ...props }, ref) => {
  return jsxs("svg", {
    ref,
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
    children: [
      jsx("path", { d: "M6 17h12", key: "1jwigz" }),
    ],
  });
});

ChefHatIcon.displayName = "ChefHatIcon";

export { ChefHatIcon };
