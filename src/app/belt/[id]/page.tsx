import { BeltPlay } from "@/components/hold-the-belt/belt-play";

export default async function BeltPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BeltPlay id={id} />;
}
