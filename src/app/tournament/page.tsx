import { redirect } from "next/navigation";

// /tournament (singular, no id) isn't a real page — send users to the list.
export default function TournamentIndex() {
  redirect("/tournaments");
}
