import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        // Archivo — sporty grotesque — carries headings & scores; Rubik keeps body.
        heading: { value: "var(--font-archivo)" },
        body: { value: "var(--font-rubik)" },
      },
      colors: {
        // Brand — club-crest maroon/claret. Named `brand` (not `blue`) so the
        // token reads true; the matching `brand` semantic tokens below make
        // `colorPalette="brand"` and brand.solid/fg/subtle resolve like a
        // built-in palette.
        brand: {
          50: { value: "#FBECF0" },
          100: { value: "#F5D2DC" },
          200: { value: "#E9A9BB" },
          300: { value: "#DA7B94" },
          400: { value: "#C55070" },
          500: { value: "#9E2B44" },
          600: { value: "#85243A" },
          700: { value: "#6C1D30" },
          800: { value: "#571825" },
          900: { value: "#47141F" },
          950: { value: "#2B0B13" },
        },
        // Earned gold — champions & trophies only.
        gold: {
          50: { value: "#FBF3DF" },
          100: { value: "#F5E4B8" },
          200: { value: "#EBCF82" },
          300: { value: "#DFB958" },
          400: { value: "#CFA24A" },
          500: { value: "#B8863A" },
          600: { value: "#996C2E" },
          700: { value: "#795326" },
          800: { value: "#5E4020" },
          900: { value: "#4A331B" },
          950: { value: "#2B1D0E" },
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
        // Neutral scale — warmed off the cool Chakra grays toward a paper/ground
        // feel, so the whole app reads warm without touching every component.
        gray: {
          50: { value: "#F7F5F1" },
          100: { value: "#EFEBE4" },
          200: { value: "#E4DED4" },
          300: { value: "#D0C8BB" },
          400: { value: "#A79E92" },
          500: { value: "#786F66" },
          600: { value: "#4F4842" },
          700: { value: "#332F2A" },
          800: { value: "#1E1B18" },
          900: { value: "#161311" },
          950: { value: "#0A0807" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Brand palette semantic tokens — required so `colorPalette="brand"`
        // and brand.solid/fg/muted/subtle/emphasized resolve like Chakra's
        // built-in palettes (which is what the old `blue` usages relied on).
        brand: {
          solid: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
          contrast: { value: { base: "white", _dark: "white" } },
          fg: { value: { base: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          muted: { value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle: { value: { base: "{colors.brand.50}", _dark: "{colors.brand.950}" } },
          emphasized: { value: { base: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          focusRing: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
        },
        // Background tokens
        bg: {
          canvas: {
            value: { base: "{colors.gray.50}", _dark: "{colors.gray.950}" },
          },
          surface: {
            value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
          },
          subtle: {
            value: { base: "{colors.gray.50}", _dark: "{colors.gray.800}" },
          },
          muted: {
            value: { base: "{colors.gray.100}", _dark: "{colors.gray.700}" },
          },
        },

        // Foreground/text tokens
        fg: {
          default: {
            value: { base: "{colors.gray.900}", _dark: "{colors.gray.100}" },
          },
          muted: {
            value: { base: "{colors.gray.600}", _dark: "{colors.gray.400}" },
          },
          subtle: {
            value: { base: "{colors.gray.500}", _dark: "{colors.gray.700}" },
          },
          disabled: {
            value: { base: "{colors.gray.400}", _dark: "{colors.gray.600}" },
          },
          placeholder: {
            value: { base: "{colors.gray.400}", _dark: "{colors.gray.600}" },
          },
        },

        // Border tokens
        border: {
          default: {
            value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
          },
          subtle: {
            value: { base: "{colors.gray.100}", _dark: "{colors.gray.800}" },
          },
          muted: {
            value: { base: "{colors.gray.300}", _dark: "{colors.gray.600}" },
          },
          emphasized: {
            value: { base: "{colors.gray.400}", _dark: "{colors.gray.500}" },
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
            value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
          },
          border: {
            value: { base: "{colors.gray.200}", _dark: "{colors.gray.700}" },
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
            value: { base: "{colors.white}", _dark: "{colors.gray.800}" },
          },
          border: {
            value: { base: "{colors.gray.300}", _dark: "{colors.gray.600}" },
          },
          focusBorder: {
            value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" },
          },
        },

        dialog: {
          bg: {
            value: { base: "{colors.white}", _dark: "{colors.gray.900}" },
          },
          backdrop: {
            value: {
              base: "{colors.blackAlpha.400}",
              _dark: "{colors.blackAlpha.600}",
            },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
