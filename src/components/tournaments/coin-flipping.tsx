"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

interface CoinFlippingProps {
  isFlipping: boolean;
  result: "heads" | "tails" | null;
}

export function CoinFlipping({ isFlipping, result }: CoinFlippingProps) {
  const coinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coin = coinRef.current;

    if (!coin) return;

    coin.classList.remove(
      "heads",
      "tails",
      "flipping",
      "static-heads",
      "static-tails"
    );

    void coin.offsetWidth; // trigger reflow

    if (isFlipping) {
      coin.classList.add("flipping");
    } else if (result) {
      coin.classList.add(`static-${result}`);
    } else {
      // Default to showing heads when no result
      coin.classList.add("static-heads");
    }
  }, [isFlipping, result]);

  return (
    <Box
      ref={coinRef}
      className="coin"
      position="relative"
      w="140px"
      h="140px"
      mx="auto"
      my={4}
      transformStyle="preserve-3d"
    >
      {/* HEADS */}
      <Box
        className="coin-side heads"
        position="absolute"
        w="100%"
        h="100%"
        borderRadius="full"
        background="linear-gradient(145deg, #f4d03f 0%, #d4af37 25%, #b8860b 50%, #daa520 75%, #f4d03f 100%)"
        display="flex"
        justifyContent="center"
        alignItems="center"
        backfaceVisibility="hidden"
        boxShadow="inset 0 0 45px rgba(255,255,255,0.3)"
        border="3px solid #b8860b"
        zIndex={1}
        _before={{
          content: '""',
          position: "absolute",
          top: "8px",
          left: "8px",
          right: "8px",
          bottom: "8px",
          borderRadius: "full",
          border: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        <Text
          fontSize="2xl"
          color="#8b4513"
          fontWeight="900"
          letterSpacing="2px"
          fontFamily="serif"
        >
          HEADS
        </Text>
      </Box>

      {/* TAILS */}
      <Box
        className="coin-side tails"
        position="absolute"
        w="100%"
        h="100%"
        borderRadius="full"
        background="linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 25%, #a8a8a8 50%, #d3d3d3 75%, #e8e8e8 100%)"
        display="flex"
        justifyContent="center"
        alignItems="center"
        backfaceVisibility="hidden"
        transform="rotateY(180deg)"
        boxShadow="inset 0 0 45px rgba(255,255,255,0.3)"
        border="3px solid #a8a8a8"
        _before={{
          content: '""',
          position: "absolute",
          top: "8px",
          left: "8px",
          right: "8px",
          bottom: "8px",
          borderRadius: "full",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <Text
          fontSize="2xl"
          color="#4a4a4a"
          fontWeight="900"
          letterSpacing="2px"
          fontFamily="serif"
        >
          TAILS
        </Text>
      </Box>

      {/* Styles */}
      <style jsx global>{`
        .coin {
          transition: transform 1s ease-out;
        }

        .coin.flipping {
          animation: coin-spin 0.7s linear infinite;
        }

        .coin.heads {
          animation: flip-heads 0.8s ease-out forwards;
        }

        .coin.tails {
          animation: flip-tails 0.8s ease-out forwards;
        }

        .coin.static-heads {
          transform: rotateY(0deg);
        }

        .coin.static-tails {
          transform: rotateY(180deg);
        }

        @keyframes coin-spin {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @keyframes flip-heads {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(540deg); /* ends on heads */
          }
        }

        @keyframes flip-tails {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(720deg); /* ends on tails */
          }
        }
      `}</style>
    </Box>
  );
}
