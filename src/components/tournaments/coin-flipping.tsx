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
      w="120px"
      h="120px"
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
        bg="#bb0000"
        display="flex"
        flexDir="column"
        justifyContent="center"
        alignItems="center"
        backfaceVisibility="hidden"
        boxShadow="inset 0 0 45px rgba(255,255,255,0.3), 0 12px 20px -10px rgba(0,0,0,0.4)"
        zIndex={1}
      >
        <Text fontSize="lg" color="white" fontWeight="bold">
          HEADS
        </Text>
        <Text fontSize="2xl">👤</Text>
      </Box>

      {/* TAILS */}
      <Box
        className="coin-side tails"
        position="absolute"
        w="100%"
        h="100%"
        borderRadius="full"
        bg="#3e3e3e"
        display="flex"
        flexDir="column"
        justifyContent="center"
        alignItems="center"
        backfaceVisibility="hidden"
        transform="rotateY(180deg)"
        boxShadow="inset 0 0 45px rgba(255,255,255,0.3), 0 12px 20px -10px rgba(0,0,0,0.4)"
      >
        <Text fontSize="lg" color="white" fontWeight="bold">
          TAILS
        </Text>
        <Text fontSize="2xl">⭐</Text>
      </Box>

      {/* Styles */}
      <style jsx global>{`
        .coin {
          transition: transform 1s ease-out;
        }

        .coin.flipping {
          animation: coin-spin 1s linear infinite;
        }

        .coin.heads {
          animation: flip-heads 1s ease-out forwards;
        }

        .coin.tails {
          animation: flip-tails 1s ease-out forwards;
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
