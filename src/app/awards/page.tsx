import { redirect } from "next/navigation";

// Awards now live inside the Cabinet (trophies + awards, one page).
export default function AwardsPage() {
  redirect("/trophies");
}
