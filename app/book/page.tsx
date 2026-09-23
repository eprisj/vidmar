import { getBooksAtBuild } from "@/lib/api";
import BookClient from "./BookClient";

/* One page read by ?s=: the site is a static export, and a book added in the
   admin has to have a page the moment it is published, not after the next
   rebuild. The catalogue as it stood at build rides along, so the books that
   existed then paint without waiting on the API. */
export default async function BookPage() {
  const initial = await getBooksAtBuild();
  return <BookClient initial={initial} />;
}
