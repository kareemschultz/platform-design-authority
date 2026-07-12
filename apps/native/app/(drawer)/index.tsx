import { Button, Column, Text as ExpoUIText, Host } from "@expo/ui";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME, STATUS_COLORS } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { orpc, queryClient } from "@/utils/orpc";

export default function Home() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const statusColors =
		colorScheme === "dark" ? STATUS_COLORS.dark : STATUS_COLORS.light;
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	const privateData = useQuery(orpc.privateData.queryOptions());
	const isConnected = healthCheck?.data === "OK";
	const isLoading = healthCheck?.isLoading;
	const { data: session } = authClient.useSession();

	return (
		<Container>
			<ScrollView
				contentInsetAdjustmentBehavior="never"
				style={styles.scrollView}
			>
				<View style={styles.content}>
					<Host style={styles.titleHost}>
						<ExpoUIText
							textStyle={{
								color: theme.text,
								fontSize: 24,
								fontWeight: "bold",
								textAlign: "center",
							}}
						>
							Controlled Prototype
						</ExpoUIText>
					</Host>

					{session?.user ? (
						<View
							style={[
								styles.userCard,
								{ backgroundColor: theme.card, borderColor: theme.border },
							]}
						>
							<Host
								matchContents={{ vertical: true }}
								style={styles.userHeader}
							>
								<Column spacing={8}>
									<ExpoUIText textStyle={{ color: theme.text, fontSize: 16 }}>
										{`Welcome, ${session.user.name}`}
									</ExpoUIText>
									<ExpoUIText
										style={{ opacity: 0.7 }}
										textStyle={{ color: theme.text, fontSize: 14 }}
									>
										{session.user.email}
									</ExpoUIText>
								</Column>
							</Host>
							<Host matchContents={{ vertical: true }}>
								<Button
									label="Sign Out"
									onPress={() => {
										authClient.signOut();
										queryClient.invalidateQueries();
									}}
									variant="outlined"
								/>
							</Host>
						</View>
					) : null}

					<View
						style={[
							styles.statusCard,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Host
							matchContents={{ vertical: true }}
							style={styles.cardTitleHost}
						>
							<ExpoUIText
								textStyle={{
									color: theme.text,
									fontSize: 16,
									fontWeight: "bold",
								}}
							>
								System Status
							</ExpoUIText>
						</Host>
						<View style={styles.statusRow}>
							<View
								style={[
									styles.statusIndicator,
									{
										backgroundColor: isConnected
											? statusColors.success
											: statusColors.critical,
									},
								]}
							/>
							<View style={styles.statusContent}>
								<Host matchContents={{ vertical: true }}>
									<Column spacing={4}>
										<ExpoUIText
											textStyle={{
												color: theme.text,
												fontSize: 14,
												fontWeight: "bold",
											}}
										>
											ORPC Backend
										</ExpoUIText>
										<ExpoUIText
											style={{ opacity: 0.7 }}
											textStyle={{ color: theme.text, fontSize: 12 }}
										>
											{isLoading
												? "Checking connection..."
												: isConnected
													? "Connected to API"
													: "API Disconnected"}
										</ExpoUIText>
									</Column>
								</Host>
							</View>
						</View>
					</View>

					<View
						style={[
							styles.privateDataCard,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Host
							matchContents={{ vertical: true }}
							style={styles.cardTitleHost}
						>
							<ExpoUIText
								textStyle={{
									color: theme.text,
									fontSize: 16,
									fontWeight: "bold",
								}}
							>
								Private Data
							</ExpoUIText>
						</Host>
						{privateData && (
							<Host matchContents={{ vertical: true }}>
								<ExpoUIText
									style={{ opacity: 0.7 }}
									textStyle={{ color: theme.text, fontSize: 14 }}
								>
									{privateData.data?.message ?? ""}
								</ExpoUIText>
							</Host>
						)}
					</View>

					{!session?.user && (
						<>
							<SignIn />
							<SignUp />
						</>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	cardTitleHost: {
		marginBottom: 12,
	},
	content: {
		paddingBottom: 32,
		paddingHorizontal: 20,
		paddingTop: 28,
	},
	privateDataCard: {
		borderRadius: 16,
		borderWidth: 1,
		marginBottom: 16,
		padding: 16,
	},
	scrollView: {
		flex: 1,
	},
	statusCard: {
		borderRadius: 16,
		borderWidth: 1,
		marginBottom: 16,
		padding: 16,
	},
	statusContent: {
		flex: 1,
	},
	statusIndicator: {
		height: 8,
		width: 8,
	},
	statusRow: {
		alignItems: "center",
		flexDirection: "row",
		gap: 8,
	},
	titleHost: {
		alignSelf: "stretch",
		height: 34,
		marginBottom: 24,
	},
	userCard: {
		borderRadius: 16,
		borderWidth: 1,
		marginBottom: 16,
		padding: 16,
	},
	userHeader: {
		marginBottom: 8,
	},
});
