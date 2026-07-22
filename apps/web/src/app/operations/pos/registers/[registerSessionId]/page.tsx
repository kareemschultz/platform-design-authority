import { RegisterSessionPage } from "@/components/register-pages";

export default async function Page({
	params,
}: {
	params: Promise<{ registerSessionId: string }>;
}) {
	const { registerSessionId } = await params;
	return <RegisterSessionPage registerSessionId={registerSessionId} />;
}
