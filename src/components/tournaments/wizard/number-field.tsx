"use client";

import { Box, NumberInput, Text } from "@chakra-ui/react";

/** A labelled numeric stepper used for overs / wickets in the setup flow. */
export function NumberField({
  label,
  helper,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
        {label}
      </Text>
      <NumberInput.Root
        value={value.toString()}
        min={min}
        max={max}
        onValueChange={(d) => {
          const v = parseInt(d.value);
          if (!isNaN(v)) onChange(v);
        }}
        size="lg"
      >
        <NumberInput.Control />
        <NumberInput.Input
          bg="input.bg"
          borderColor="input.border"
          color="fg.default"
          _focus={{
            borderColor: "input.focusBorder",
            boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
          }}
        />
      </NumberInput.Root>
      <Text fontSize="xs" color="fg.muted" mt={1}>
        {helper}
      </Text>
    </Box>
  );
}
