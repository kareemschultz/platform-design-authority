import { TransferDetailPage } from "@/components/inventory-transfer-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ transferId: string }>;
}) {
	const { transferId } = await params;
	return <TransferDetailPage transferId={transferId} />;
}
