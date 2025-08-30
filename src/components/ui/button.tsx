"use client";

import { forwardRef } from "react";
import { Button as ChakraButton, ButtonProps } from "@chakra-ui/react";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "surface",
      size = {
        base: "sm",
        md: "md",
      },
      colorPalette = "blue",
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
