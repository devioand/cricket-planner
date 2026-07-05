"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { system } from "../theme";
import { QueryProvider } from "@/lib/query/query-provider";

export function Provider(props: ColorModeProviderProps) {
  return (
    <QueryProvider>
      <ChakraProvider value={system}>
        <ColorModeProvider {...props} />
      </ChakraProvider>
    </QueryProvider>
  );
}
