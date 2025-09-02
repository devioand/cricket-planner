import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-rubik)" },
        body: { value: "var(--font-rubik)" },
      },
      colors: {
        // Blue color scale - Chakra UI colors
        blue: {
          50: { value: "#ebf8ff" },
          100: { value: "#bee3f8" },
          200: { value: "#90cdf4" },
          300: { value: "#63b3ed" },
          400: { value: "#4299e1" },
          500: { value: "#3182ce" },
          600: { value: "#2b6cb0" },
          700: { value: "#2c5282" },
          800: { value: "#2a4365" },
          900: { value: "#1A365D" },
          950: { value: "#0c142e" },
        },
        // Yellow color scale - Chakra UI colors
        yellow: {
          50: { value: "#FFFFF0" },
          100: { value: "#FEFCBF" },
          200: { value: "#FAF089" },
          300: { value: "#F6E05E" },
          400: { value: "#ECC94B" },
          500: { value: "#D69E2E" },
          600: { value: "#B7791F" },
          700: { value: "#975A16" },
          800: { value: "#744210" },
          900: { value: "#5F370E" },
          950: { value: "#4A2C0A" },
        },
        // Green color scale - Chakra UI colors
        green: {
          50: { value: "#F0FFF4" },
          100: { value: "#C6F6D5" },
          200: { value: "#9AE6B4" },
          300: { value: "#68D391" },
          400: { value: "#48BB78" },
          500: { value: "#38A169" },
          600: { value: "#2F855A" },
          700: { value: "#276749" },
          800: { value: "#22543D" },
          900: { value: "#1C4532" },
          950: { value: "#163B28" },
        },
        // Red color scale - Chakra UI colors
        red: {
          50: { value: "#FFF5F5" },
          100: { value: "#FED7D7" },
          200: { value: "#FEB2B2" },
          300: { value: "#FC8181" },
          400: { value: "#F56565" },
          500: { value: "#E53E3E" },
          600: { value: "#C53030" },
          700: { value: "#9B2C2C" },
          800: { value: "#822727" },
          900: { value: "#63171B" },
          950: { value: "#4A1215" },
        },
        // Purple color scale for additional features
        purple: {
          50: { value: "#faf5ff" },
          100: { value: "#f3e8ff" },
          200: { value: "#e9d5ff" },
          300: { value: "#d8b4fe" },
          400: { value: "#c084fc" },
          500: { value: "#a855f7" },
          600: { value: "#9333ea" },
          700: { value: "#7c3aed" },
          800: { value: "#6b21a8" },
          900: { value: "#581c87" },
          950: { value: "#3b0764" },
        },
        // Gray color scale - modern neutral colors
        gray: {
          50: { value: "#f8fafc" },
          100: { value: "#f1f5f9" },
          200: { value: "#e2e8f0" },
          300: { value: "#cbd5e1" },
          400: { value: "#94a3b8" },
          500: { value: "#64748b" },
          600: { value: "#475569" },
          700: { value: "#334155" },
          800: { value: "#1e293b" },
          900: { value: "#0f172a" },
          950: { value: "#020617" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Background tokens
        bg: {
          canvas: {
            value: { base: "white", _dark: "gray.950" },
          },
          surface: {
            value: { base: "white", _dark: "gray.900" },
          },
          subtle: {
            value: { base: "gray.50", _dark: "gray.800" },
          },
          muted: {
            value: { base: "gray.100", _dark: "gray.700" },
          },
        },

        // Foreground/text tokens
        fg: {
          default: {
            value: { base: "gray.900", _dark: "gray.100" },
          },
          muted: {
            value: { base: "gray.600", _dark: "gray.400" },
          },
          subtle: {
            value: { base: "gray.500", _dark: "gray.500" },
          },
          disabled: {
            value: { base: "gray.400", _dark: "gray.600" },
          },
          placeholder: {
            value: { base: "gray.400", _dark: "gray.600" },
          },
        },

        // Border tokens
        border: {
          default: {
            value: { base: "gray.200", _dark: "gray.700" },
          },
          subtle: {
            value: { base: "gray.100", _dark: "gray.800" },
          },
          muted: {
            value: { base: "gray.300", _dark: "gray.600" },
          },
          emphasized: {
            value: { base: "gray.400", _dark: "gray.500" },
          },
        },

        // Color palette semantic tokens
        colorPalette: {
          50: {
            value: {
              base: "{colors.colorPalette.50}",
              _dark: "{colors.colorPalette.950}",
            },
          },
          100: {
            value: {
              base: "{colors.colorPalette.100}",
              _dark: "{colors.colorPalette.900}",
            },
          },
          200: {
            value: {
              base: "{colors.colorPalette.200}",
              _dark: "{colors.colorPalette.800}",
            },
          },
          300: {
            value: {
              base: "{colors.colorPalette.300}",
              _dark: "{colors.colorPalette.700}",
            },
          },
          400: {
            value: {
              base: "{colors.colorPalette.400}",
              _dark: "{colors.colorPalette.600}",
            },
          },
          500: { value: "{colors.colorPalette.500}" },
          600: {
            value: {
              base: "{colors.colorPalette.600}",
              _dark: "{colors.colorPalette.400}",
            },
          },
          700: {
            value: {
              base: "{colors.colorPalette.700}",
              _dark: "{colors.colorPalette.300}",
            },
          },
          800: {
            value: {
              base: "{colors.colorPalette.800}",
              _dark: "{colors.colorPalette.200}",
            },
          },
          900: {
            value: {
              base: "{colors.colorPalette.900}",
              _dark: "{colors.colorPalette.100}",
            },
          },
          950: {
            value: {
              base: "{colors.colorPalette.950}",
              _dark: "{colors.colorPalette.50}",
            },
          },
        },

        // Component specific semantic tokens
        card: {
          bg: {
            value: { base: "white", _dark: "gray.800" },
          },
          border: {
            value: { base: "gray.200", _dark: "gray.700" },
          },
          selected: {
            value: {
              base: "{colors.colorPalette.500}",
              _dark: "{colors.colorPalette.600}",
            },
          },
          selectedBorder: {
            value: {
              base: "{colors.colorPalette.300}",
              _dark: "{colors.colorPalette.300}",
            },
          },
        },

        input: {
          bg: {
            value: { base: "white", _dark: "gray.800" },
          },
          border: {
            value: { base: "gray.300", _dark: "gray.600" },
          },
          focusBorder: {
            value: { base: "blue.500", _dark: "blue.400" },
          },
        },

        dialog: {
          bg: {
            value: { base: "white", _dark: "black" },
          },
          backdrop: {
            value: { base: "blackAlpha.400", _dark: "blackAlpha.600" },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
