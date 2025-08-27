"use client";

import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "surface",
      size = {
        base: "sm",
        md: "md",
      },
      colorPalette = "blue",
      rounded = "md",
      ...rest
    } = props;

    return (
      <ChakraButton
        ref={ref}
        variant={variant}
        size={size}
        colorPalette={colorPalette}
        {...rest}
      />
    );
  }
);
