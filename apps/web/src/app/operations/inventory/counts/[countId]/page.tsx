import { CountDetailPage } from "@/components/inventory-count-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ countId: string }>;
}) {
	const { countId } = await params;
	return <CountDetailPage countId={countId} />;
}
