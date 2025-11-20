import React, {useContext, useState} from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootContext} from '../../context/RootContext';
import {hideBusinessModal} from '../../context/reducer';
import AppStyles from '../../AppStyles';
import FlipCard from './FlipCard';
import StarRating from './StarRating';
import OpenSign from '../results/OpenSign';
import {FontAwesome, Ionicons, MaterialIcons} from '@expo/vector-icons';
import {useBusinessDetails} from '../../hooks/useBusinessDetails';
import useBusinessHours from '../../hooks/useBusinessHours';
import {useFavorites} from '../../hooks/useFavorites';
import {BusinessProps} from '../../hooks/useResults';
import ImageViewerModal from './ImageViewerModal';
import {radius} from "../../theme";

// Helper function to format distance
const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
};

export function BusinessCardModal() {
    const {state, dispatch} = useContext(RootContext);
    const {width: winW, height: winH} = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [isFlipped, setIsFlipped] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const {isBusinessModalOpen, selectedBusiness} = state;

    // Convert to BusinessProps for hooks
    const businessForHook: BusinessProps | null = selectedBusiness ? {
        id: selectedBusiness.id,
        name: selectedBusiness.name,
        image_url: selectedBusiness.image_url || '',
        rating: selectedBusiness.rating || 0,
        price: selectedBusiness.price || '',
        location: selectedBusiness.location || {city: '', display_address: [], address1: ''},
        categories: selectedBusiness.categories || [],
        is_closed: selectedBusiness.is_closed || false,
        coordinates: selectedBusiness.coordinates,
        url: selectedBusiness.url || '',
        phone: selectedBusiness.phone || '',
        display_phone: selectedBusiness.display_phone || '',
        alias: selectedBusiness.alias || '',
        distance: selectedBusiness.distance || 0,
        photos: selectedBusiness.photos || [],
        review_count: selectedBusiness.review_count || 0,
        transactions: selectedBusiness.transactions || [],
        hours: selectedBusiness.hours || [],
    } : null;

    // Hooks
    const {
        business: enrichedBusiness,
        loading: detailsLoading,
        fetchDetails,
        hasDetails
    } = useBusinessDetails(businessForHook || {} as BusinessProps, false);
    const {todayLabel, isOpen} = useBusinessHours(enrichedBusiness.hours);
    const {isFavorite, toggleFavorite} = useFavorites();

    if (!selectedBusiness || !businessForHook) {
        return null;
    }

    const business = selectedBusiness;
    const is_open_now = business.hours && business.hours[0]?.is_open_now || isOpen;

    const handleBackdropPress = () => {
        setIsFlipped(false);
        dispatch(hideBusinessModal());
    };

    const handleClosePress = () => {
        setIsFlipped(false);
        dispatch(hideBusinessModal());
    };

    const handleFlip = (flipped: boolean) => {
        setIsFlipped(flipped);
        if (flipped && !hasDetails) {
            fetchDetails();
        }
    };

    const handlePhotoPress = (index: number) => {
        setSelectedImageIndex(index);
        setImageViewerVisible(true);
    };

    const handleMapsPress = () => {
        const address = business.location?.display_address?.join(', ') || '';
        const encodedAddress = encodeURIComponent(address);

        if (Platform.OS === 'ios') {
            Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
        }
    };

    const handleYelpPress = () => {
        if (business.url) {
            Linking.openURL(business.url);
        }
    };

    const handlePhonePress = () => {
        if (business.phone) {
            Linking.openURL(`tel:${business.phone}`);
        }
    };

    // Calculate dimensions
    const H_PADDING = 16 + insets.left + insets.right;
    const modalMaxWidth = Math.min(700, Math.max(320, Math.floor(winW - H_PADDING * 2)));
    const imageSize = modalMaxWidth - 24;
    const cardMinHeight = imageSize / 2 + 120;

    // Format info for back card
    const distanceText = business.distance ? formatDistance(business.distance) : '';
    const hoursDisplay = hasDetails && todayLabel !== 'Hours unavailable' ? todayLabel : (is_open_now ? 'Open Now' : 'Closed');
    const quickInfo = [business.price, distanceText, hoursDisplay].filter(Boolean).join(' • ');

    const frontContent = (
        <View style={[styles.cardContent, {minHeight: cardMinHeight}]}>
            <View style={styles.imageContainer}>
                {business.image_url ? (
                    <Image
                        style={{height: imageSize / 2, width: imageSize}}
                        source={{uri: business.image_url}}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.noImage, {height: imageSize / 2, width: imageSize}]}>
                        <Text style={styles.noImageText}>No Image</Text>
                    </View>
                )}
                <Pressable
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(businessForHook)}
                    android_ripple={{
                        color: "rgba(255,255,255,0.3)",
                        radius: 20,
                        borderless: true,
                    }}
                    accessibilityLabel={isFavorite(business.id) ? "Remove from favorites" : "Add to favorites"}
                >
                    <Ionicons
                        name={isFavorite(business.id) ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorite(business.id) ? AppStyles.color.yelp : AppStyles.color.white}
                        style={styles.iconFavorite}
                    />
                </Pressable>
            </View>
            <View style={styles.detail}>
                <View style={styles.detailHeader}>
                    <Text style={styles.name} numberOfLines={2}>{business.name}</Text>
                    <Text style={{fontSize: 22, fontFamily: AppStyles.fonts.semiBold}}>
                        {business.price}
                    </Text>
                </View>
                <View style={{flexDirection: "row"}}>
                    <Text style={styles.subText} numberOfLines={1}>
                        {business.categories?.map(cat => cat.title).join(', ')} • {business.location?.city}
                    </Text>
                </View>
                <View style={{flexDirection: "row", marginTop: 4}}>
                    <StarRating rating={business.rating || 0}/>
                    <Text style={styles.review}>{business.review_count} Reviews</Text>
                </View>
            </View>
            <Pressable
                style={styles.flipButtonCorner}
                onPress={() => handleFlip(true)}
                android_ripple={{
                    color: "rgba(0,0,0,0.1)",
                    radius: 24,
                    borderless: true,
                }}
                accessibilityLabel="View details"
            >
                <MaterialIcons name="info" size={28} color={AppStyles.color.primary}/>
            </Pressable>
        </View>
    );

    const backContent = (
        <View style={styles.cardContent}>
            <View style={styles.backHeader}>
                <Text style={styles.backTitle} numberOfLines={2}>{business.name}</Text>
                <OpenSign is_open_now={is_open_now}/>
            </View>

            {quickInfo && (
                <View style={styles.quickInfo}>
                    <Text style={styles.quickInfoText}>{quickInfo}</Text>
                </View>
            )}

            <View style={styles.backRating}>
                <StarRating rating={business.rating || 0}/>
                <Text
                    style={styles.backReviewText}>{business.review_count} Review{business.review_count > 1 ? 's' : ''}</Text>
            </View>

            {detailsLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={AppStyles.color.primary}/>
                    <Text style={styles.loadingText}>Loading details...</Text>
                </View>
            )}

            {enrichedBusiness.photos && enrichedBusiness.photos.length > 0 && (
                <View style={styles.photoContainer}>
                    {enrichedBusiness.photos.slice(0, 3).map((photo, idx) => (
                        <Pressable
                            key={idx}
                            onPress={() => handlePhotoPress(idx)}
                            android_ripple={{
                                color: "rgba(0,0,0,0.1)",
                            }}
                            style={styles.photoWrapper}
                        >
                            <Image
                                source={{uri: photo}}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                            <View style={styles.photoOverlay}>
                                <MaterialIcons name="zoom-out-map" size={20} color={AppStyles.color.white}/>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            <View style={styles.backDetails}>
                <Text style={styles.backDetailText}>
                    <MaterialIcons name="location-on" size={16} color={AppStyles.color.primary}/>
                    {' '}{business.location?.display_address?.join(', ')}
                </Text>

                {business.phone && (
                    <Text style={styles.backDetailText}>
                        <MaterialIcons name="phone" size={16} color={AppStyles.color.primary}/>
                        {' '}{business.display_phone}
                    </Text>
                )}

                <Text style={styles.backDetailText}>
                    <MaterialIcons name="category" size={16} color={AppStyles.color.primary}/>
                    {' '}{business.categories?.map(cat => cat.title).join(', ')}
                </Text>
            </View>

            <View style={{flex: 1}}/>

            <View style={styles.backActions}>
                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
                    ]}
                    onPress={handleMapsPress}
                    android_ripple={{
                        color: "grey",
                        radius: 28,
                        borderless: true,
                    }}
                >
                    <MaterialIcons
                        color={AppStyles.color.primary}
                        name="map"
                        size={20}
                    />
                    <Text style={styles.backButtonText}>Maps</Text>
                </Pressable>

                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
                    ]}
                    onPress={handleYelpPress}
                    android_ripple={{
                        color: "grey",
                        radius: 28,
                        borderless: true,
                    }}
                >
                    <FontAwesome
                        color={AppStyles.color.yelp}
                        name="yelp"
                        size={20}
                    />
                    <Text style={styles.backButtonText}>Yelp</Text>
                </Pressable>

                {business.phone && (
                    <Pressable
                        style={({pressed}) => [
                            styles.backButton,
                            {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
                        ]}
                        onPress={handlePhonePress}
                        android_ripple={{
                            color: "grey",
                            radius: 28,
                            borderless: true,
                        }}
                    >
                        <MaterialIcons
                            color={AppStyles.color.phone}
                            name="phone-in-talk"
                            size={20}
                        />
                        <Text style={styles.backButtonText}>Call</Text>
                    </Pressable>
                )}

                <Pressable
                    style={styles.flipButtonInline}
                    onPress={() => handleFlip(false)}
                    android_ripple={{
                        color: "rgba(0,0,0,0.1)",
                        radius: 24,
                        borderless: true,
                    }}
                    accessibilityLabel="Close details"
                >
                    <MaterialIcons name="rotate-left" size={28} color={AppStyles.color.primary}/>
                </Pressable>
            </View>
        </View>
    );

    return (
        <>
            <Modal
                visible={isBusinessModalOpen}
                transparent
                animationType="fade"
                onRequestClose={handleBackdropPress}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={handleBackdropPress}
                    testID="modal-backdrop"
                >
                    <View style={styles.modalContainer}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <View style={{maxWidth: modalMaxWidth, width: modalMaxWidth}}>
                                <FlipCard
                                    front={frontContent}
                                    back={backContent}
                                    style={styles.flipCard}
                                    flipped={isFlipped}
                                    onFlipChange={handleFlip}
                                    disableTapToFlip={true}
                                    disableSwipeToFlip={true}
                                />
                            </View>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                visible={imageViewerVisible}
                images={enrichedBusiness.photos || []}
                initialIndex={selectedImageIndex}
                onClose={() => setImageViewerVisible(false)}
            />
        </>
    );
}

const textStyle = {
    color: "rgba(128,128,128, 0.80)",
    fontFamily: AppStyles.fonts.regular,
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    flipCard: {
        // Empty - let content handle its own styling for 3D flip effect
    },
    cardContent: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: AppStyles.color.white,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            height: 6,
            width: 0,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    detail: {
        backgroundColor: AppStyles.color.white,
        paddingHorizontal: 16,
        paddingVertical: 6,
        paddingBottom: 16,
    },
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    favoriteButton: {
        padding: 8,
        position: "absolute",
        right: 8,
        top: 8,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    iconFavorite: {
        textShadowColor: AppStyles.color.black,
        textShadowOffset: {
            width: 0,
            height: 0,
        },
        textShadowRadius: 4,
    },
    imageContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
    },
    noImage: {
        backgroundColor: AppStyles.color.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 18,
        fontFamily: AppStyles.fonts.medium,
        color: AppStyles.color.greylight,
    },
    name: {
        color: AppStyles.color.black,
        flex: 1,
        fontSize: 22,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: "bold",
        paddingBottom: 6,
        paddingRight: 8,
    },
    subText: {
        ...textStyle,
        flex: 1,
        paddingRight: 4,
    },
    review: {
        ...textStyle,
        marginLeft: 8,
    },
    // Back of card styles
    backHeader: {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: AppStyles.color.primary,
    },
    backTitle: {
        color: AppStyles.color.white,
        fontSize: 20,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    quickInfo: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    quickInfoText: {
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: AppStyles.color.black,
    },
    backRating: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 2,
    },
    backReviewText: {
        ...textStyle,
        marginLeft: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: AppStyles.fonts.regular,
        color: AppStyles.color.primary,
    },
    photoContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    photoWrapper: {
        flex: 1,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: 80,
        borderRadius: 8,
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 4,
    },
    backDetails: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    backDetailText: {
        ...textStyle,
        fontSize: 15,
        marginBottom: 6,
        lineHeight: 20,
    },
    backActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: AppStyles.input.shadow,
        ...AppStyles.ButtonPressable,
        borderRadius: 20,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: AppStyles.color.black,
    },
    flipButtonCorner: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'transparent',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButtonInline: {
        backgroundColor: 'transparent',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    },
});
