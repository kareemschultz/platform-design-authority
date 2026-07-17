import { ProductDetailPage } from "@/components/product-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	return <ProductDetailPage productId={productId} />;
}
