import type { Metadata } from "next";
import { getBooksAtBuild } from "@/lib/api";
import { bookMeta, pageMeta } from "@/lib/seo";
import BookClient from "../BookClient";

/* One static page per book known at build: its own address, title,
   description and cover card for search engines and shared links. A book
   published after the build still opens at /book?s=<slug> until the next
   deploy bakes its page. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await getBooksAtBuild();
  // an export needs at least one page here; an unreachable API bakes a "not found"
  return books.length ? books.map((b) => ({ slug: b.slug })) : [{ slug: "missing" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = (await getBooksAtBuild()).find((x) => x.slug === slug);
  return b ? bookMeta(b) : { ...pageMeta("Книга – ВІДЬМАР", "Книга видавництва ВІДЬМАР.", "/catalog"), robots: { index: false } };
}

export default async function BookSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initial = await getBooksAtBuild();
  return <BookClient initial={initial} slug={slug} />;
}
