import { InventoryAdjustmentDetailPage } from "@/components/inventory-adjustment-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ adjustmentId: string }>;
}) {
	const { adjustmentId } = await params;
	return <InventoryAdjustmentDetailPage adjustmentId={adjustmentId} />;
}
