import { ReceiptViewPage } from "@/components/receipt-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ receiptId: string }>;
}) {
	const { receiptId } = await params;
	return <ReceiptViewPage receiptId={receiptId} />;
}
