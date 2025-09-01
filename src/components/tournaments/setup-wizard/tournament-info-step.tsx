"use client";

import React, { useState } from "react";
import { VStack, Input, Text, Card, HStack, Badge } from "@chakra-ui/react";
import { StepContainer } from "@/components/ui/stepper";

interface TournamentInfoStepProps {
  onDataChange: (data: TournamentInfoData) => void;
  initialData?: TournamentInfoData;
}

export interface TournamentInfoData {
  name: string;
  description: string;
  format: "round-robin";
}

export function TournamentInfoStep({
  onDataChange,
  initialData,
}: TournamentInfoStepProps) {
  const [data, setData] = useState<TournamentInfoData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    format: "round-robin",
  });

  const handleChange = (field: keyof TournamentInfoData, value: string) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onDataChange(newData);
  };

  return (
    <StepContainer
      title="Tournament Information"
      description="Let's start by setting up basic information about your tournament"
    >
      <VStack align="stretch" gap={6}>
        {/* Tournament Name */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Tournament Name
          </Text>
          <Input
            placeholder="e.g., Office Cricket Championship 2024"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            size="lg"
            maxLength={50}
          />
          <Text fontSize="xs" color="gray.500">
            Give your tournament a memorable name (optional)
          </Text>
        </VStack>

        {/* Tournament Description */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Description
          </Text>
          <Input
            placeholder="e.g., Annual cricket tournament for office teams"
            value={data.description}
            onChange={(e) => handleChange("description", e.target.value)}
            size="lg"
            maxLength={100}
          />
          <Text fontSize="xs" color="gray.500">
            Brief description of your tournament (optional)
          </Text>
        </VStack>

        {/* Tournament Format */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Tournament Format
          </Text>
          <Card.Root borderWidth={2} borderColor="blue.200" bg="blue.50">
            <Card.Body p={4}>
              <HStack justify="space-between" align="center">
                <VStack align="start" gap={1}>
                  <HStack>
                    <Text fontWeight="semibold" color="blue.800">
                      🏏 Round Robin
                    </Text>
                    <Badge colorPalette="blue" variant="solid">
                      Selected
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="blue.700">
                    Every team plays every other team once. Fair and
                    comprehensive format.
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>
          <Text fontSize="xs" color="gray.500">
            More tournament formats coming soon!
          </Text>
        </VStack>

        {/* Preview */}
        {(data.name || data.description) && (
          <Card.Root bg="gray.50" borderColor="gray.200">
            <Card.Body p={4}>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  Preview
                </Text>
                <VStack align="start" gap={1}>
                  {data.name && (
                    <Text fontSize="md" fontWeight="medium" color="gray.800">
                      {data.name}
                    </Text>
                  )}
                  {data.description && (
                    <Text fontSize="sm" color="gray.600">
                      {data.description}
                    </Text>
                  )}
                  <Text fontSize="xs" color="gray.500">
                    Format: Round Robin Tournament
                  </Text>
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </StepContainer>
  );
}
