import React, { useState } from 'react';
import { StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { View, Text } from '../Themed';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AppStyles from '../../AppStyles';
import { ResolvedLocation } from '../../hooks/useLocation';
import Config from '../../Config';

interface LocationDisambiguationProps {
	resolvedLocation: ResolvedLocation | null;
	onSelectAlternative: (label: string, coords: { latitude: number; longitude: number }) => void;
}

const LocationDisambiguation = ({ resolvedLocation, onSelectAlternative }: LocationDisambiguationProps) => {
	const [showModal, setShowModal] = useState(false);

	// Only show if we have alternatives
	if (!resolvedLocation?.alternatives || resolvedLocation.alternatives.length === 0) {
		return null;
	}

	const alternatives = resolvedLocation.alternatives;
	const selectedLabel = resolvedLocation.label;

	return (
		<>
			<Pressable
				testID="location-disambiguation-trigger"
				style={({ pressed }) => [
					styles.container,
					{ opacity: !Config.isAndroid && pressed ? 0.7 : 1 }
				]}
				onPress={() => setShowModal(true)}
				android_ripple={{ color: 'lightgrey' }}
			>
				<Icon name="location-on" size={14} color={AppStyles.color.primary} style={styles.icon} />
				<Text style={styles.label}>{selectedLabel}</Text>
				<Icon name="arrow-drop-down" size={18} color={AppStyles.color.greymed} />
			</Pressable>

			<Modal
				visible={showModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowModal(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setShowModal(false)}
				>
					<View style={styles.modalContent} onStartShouldSetResponder={() => true}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Select Location</Text>
							<Pressable
								onPress={() => setShowModal(false)}
								style={({ pressed }) => [
									styles.closeButton,
									{ opacity: !Config.isAndroid && pressed ? 0.6 : 1 }
								]}
								android_ripple={{ color: 'lightgrey', radius: 20, borderless: true }}
							>
								<Icon name="close" size={24} color={AppStyles.color.greymed} />
							</Pressable>
						</View>

						<ScrollView style={styles.alternativesList}>
							{alternatives.map((alt, index) => {
								const isSelected = alt.label === selectedLabel;
								const distanceText = alt.distance !== undefined
									? alt.distance < 1
										? '< 1 km'
										: `${Math.round(alt.distance)} km`
									: '';

								return (
									<Pressable
										key={`${alt.label}-${index}`}
										testID={`location-alt-${index}`}
										style={({ pressed }) => [
											styles.alternativeItem,
											isSelected && styles.alternativeItemSelected,
											{ opacity: !Config.isAndroid && pressed ? 0.7 : 1 }
										]}
										onPress={() => {
											onSelectAlternative(alt.label, alt.coords);
											setShowModal(false);
										}}
										android_ripple={{ color: AppStyles.color.greylight }}
									>
										<View style={styles.alternativeContent}>
											<View style={styles.alternativeText}>
												<Text style={[
													styles.alternativeLabel,
													isSelected && styles.alternativeLabelSelected
												]}>
													{alt.label}
												</Text>
												{distanceText && (
													<Text style={styles.alternativeDistance}>{distanceText}</Text>
												)}
											</View>
											{isSelected && (
												<Icon name="check" size={20} color={AppStyles.color.primary} />
											)}
										</View>
									</Pressable>
								);
							})}
						</ScrollView>
					</View>
				</Pressable>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: AppStyles.color.white,
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	icon: {
		marginRight: 6,
	},
	label: {
		flex: 1,
		fontSize: 13,
		color: AppStyles.color.grey,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: AppStyles.color.white,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '70%',
		paddingBottom: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: AppStyles.color.greylight,
		backgroundColor: AppStyles.color.white,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: AppStyles.color.black,
	},
	closeButton: {
		padding: 4,
	},
	alternativesList: {
		backgroundColor: AppStyles.color.white,
	},
	alternativeItem: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: AppStyles.color.greylight,
		backgroundColor: AppStyles.color.white,
	},
	alternativeItemSelected: {
		backgroundColor: AppStyles.color.background,
	},
	alternativeContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'transparent',
	},
	alternativeText: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	alternativeLabel: {
		fontSize: 16,
		color: AppStyles.color.black,
		marginBottom: 2,
	},
	alternativeLabelSelected: {
		fontWeight: '600',
		color: AppStyles.color.primary,
	},
	alternativeDistance: {
		fontSize: 13,
		color: AppStyles.color.grey,
	},
});

export default LocationDisambiguation;
