import { ImportDetailPage } from "@/components/import-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ importId: string; target: string }>;
}) {
	const { importId, target } = await params;
	return <ImportDetailPage importId={importId} target={target} />;
}
