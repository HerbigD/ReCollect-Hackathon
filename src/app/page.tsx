import { ReCollectApp } from "@/components/ReCollectApp";
import type { CollectionPreview } from "@/components/uiTypes";
import { getAllSavedItems } from "@/db/sqlite";

export default function HomePage() {
  const items: CollectionPreview[] = getAllSavedItems().map((item) => ({
    id: item.id,
    platform: item.platform,
    title: item.title,
    url: item.url,
    author: item.author,
    thumbnail: item.thumbnail,
  }));
  return <ReCollectApp items={items} />;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
